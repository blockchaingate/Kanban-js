#!/bin/bash
#
# Installs the Graphics Driver for OpenCL (SRB5.0) on Linux.
#
# Usage: sudo -E ./install_OCL_driver.sh <install|uninstall> [OPTION]...
#
# Supported platforms:
#     5th, 6th or 7th generation Intel® processor with Intel(R)
#     Processor Graphics Technology not previously disabled by the BIOS
#     or motherboard settings or Intel Pentium J4000 and Intel Celeron
#     J3000 processors.
#
# Official document:
#     http://registrationcenter-download.intel.com/akdlm/irc_nas/11396/SRB5.0_linux64.zip
#     replace this with link to download
#
# Optimization note: at the end of installation you will have on:
#
# 1) CentOS
#    <workspace>/rpmbuild/RPMS/x86_64/kernel-4.7.0.intel.r*-1.x86_64.rpm
#    <workspace>/rpmbuild/RPMS/x86_64/kernel-devel-4.7.0.intel.r*-1.x86_64.rpm
#
# 2) Ubuntu
#    <workspace>/linux-image-4.7.0.intel.r*-*.deb
#    <workspace>/linux-headers-4.7.0.intel.r*-*.deb
#
# You may deploy these packages on other systems you have, and
# then launch this script on these systems. This will result in a
# *significantly faster* installation time.
#
#
RELEASE_NUM="5.0"
BUILD_ID="r5.0-63503"
EXIT_FAILURE=1
SRB_5_0=http://registrationcenter-download.intel.com/akdlm/irc_nas/11396/SRB5.0_linux64.zip
KERNEL_4_7=https://cdn.kernel.org/pub/linux/kernel/v4.x/linux-4.7.tar.xz
SRB_5_0_SHA="a3989a7a00f216b1a50bad37dc49629c3f7ce65104a2ca665e59d8c699bf7443"
KERNEL_4_7_SHA="5190c3d1209aeda04168145bf50569dc0984f80467159b1dc50ad731e3285f10"
KERNEL_BUILD_MARKER=".intel_kernel_built"
LINUX_KERNEL_UNAME="4.7.0.intel.r*"

# The devel/headers package is required for the OpenCL GPU kernel debugger,
# as the kernel module (igfxdcd) needs kernel sources in order to build.
#
CENTOS_RPMS=("kernel-4.7.0.intel.r*"
             "kernel-devel-4.7.0.intel.r*")
DEBIAN_DEBS=("linux-image-4.7.0.intel.r*"
             "linux-headers-4.7.0.intel.r*")
PKGS=

SKIP_DOWNLOADS=0
INTERACTIVE=1   # 0/1 prompt/don't prompt for yum installations, set by parse_args
FAIL_ON_SHA_MISMATCH=1
TIMEOUT=5 # curl connect timeout
WORKSPACE=~/intel-opencl
CENTOS_UPGRADE_TO_72=1
BUILD_KERNEL=1
CHECK_DISTRO_VER=1

INSTALL_MODE=   # 0/1 means uninstall/install, set by parse_args
CENTOS_MINOR=
UBUNTU_VERSION=
RPMBUILD_DIR=
DISTRO=

_install_prerequisites_centos()
{
    # yum doesn't accept timeout in seconds as parameter
    echo
    echo "Note: if yum becomes non-responsive, try aborting the script and run:"
    echo "      sudo -E $0"
    echo

    local coreutils=""
    $(sha256sum --version >& /dev/null) || coreutils="coreutils"

    local minus_y=""
    [[ $INTERACTIVE -eq 0 ]] && minus_y="-y"

    CMDS=("yum $minus_y install tar libpciaccess numactl-libs $coreutils"
          "yum $minus_y groupinstall 'Development Tools'"
          "yum $minus_y install rpmdevtools openssl openssl-devel bc")

    for cmd in "${CMDS[@]}"; do
        echo $cmd
        eval $cmd
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to run $cmd >&2
            echo Problem \(or disk space\)? >&2
            echo . Verify that you have enough disk space, and run the script again. >&2
            exit $EXIT_FAIULRE
        fi
    done

    if [[ $CENTOS_UPGRADE_TO_72 -eq 1 && -n $CENTOS_MINOR && $CENTOS_MINOR -lt 2 ]]; then
        echo Upgrading from CentOS 7.$CENTOS_MINOR to CentOS 7.2...
        cmd="yum $minus_y update"
        echo $cmd
        eval $cmd
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to run $cmd >&2
            echo problem \(or disk space\)? >&2
            echo 2. Verify that you have enough disk space, and run the script again. >&2
            exit $EXIT_FAIULRE
        fi
    fi
}

_install_prerequisites_ubuntu()
{
    # apt-get doesn't accept timeout in seconds as parameter
    echo
    echo "Note: if apt-get becomes non-responsive, try aborting the script and run:"
    echo "      sudo -E $0"
    echo

    local minus_y=""
    [[ $INTERACTIVE -eq 0 ]] && minus_y="-y"

    local xz="xz-utils"


    CMDS=("apt-get $minus_y update"
          "apt-get $minus_y install openssl libnuma1 libpciaccess0"
          "apt-get $minus_y install $xz"
          "apt-get $minus_y install libpng12-dev libcairo2-dev libpango1.0-dev libglib2.0-dev"
          "apt-get $minus_y install libgtk2.0-dev libgstreamer0.10-dev libgstreamer1.0-dev"
          "apt-get $minus_y install libswscale-dev libavcodec-dev libavformat-dev cmake "
          "apt-get $minus_y install libopencv-dev checkinstall pkg-config yasm libjpeg-dev"
          "apt-get $minus_y install build-essential openssl bc curl libssl-dev libjasper-dev")

    for cmd in "${CMDS[@]}"; do
        echo $cmd
        eval $cmd
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to run $cmd >&2
            echo Problem \(or disk space\)? >&2
            echo "                sudo -E $0" >&2
            echo 2. Verify that you have enough disk space, and run the script again. >&2
            exit $EXIT_FAIULRE
        fi
    done
}

install_prerequisites()
{
    if [[ $DISTRO == "centos" ]]; then
        echo Installing prerequisites...
        _install_prerequisites_centos
    elif [[ $DISTRO == "ubuntu" ]]; then
        echo Installing prerequisites...
        _install_prerequisites_ubuntu
    fi
}

# Download the url (if needed) and compares its sha256sum against source sha.
#
# Arguments:
#     $1 - source sha256sum
#     $2 - url
#
_fetch_and_compare_sha()
{
    local src_sha=$1
    local url=$2
    local fname=$(basename $url)
    local dst_sha=""
    local should_download=0
    local cmd="curl --connect-timeout $TIMEOUT -O $url"

    if [[ -f $fname ]]; then
        dst_sha=$(sha256sum "$fname" | cut -f1 -d" ")
        [[ "$src_sha" != "$dst_sha" ]] && should_download=1
    else
        if [[ $SKIP_DOWNLOADS -eq 1 ]]; then
            echo "ERROR: failed to find $PWD/$fname" >&2
            echo "       download was skipped since --skip-downloads is set," >&2
            echo "       please download it manually and try again:" >&2
            echo "       $cmd" >&2
            exit $EXIT_FAIULRE
        fi
        should_download=1
    fi

    if [[ $should_download -eq 0 ]]; then
        echo $fname already exists, skipping download...
    elif [[ $SKIP_DOWNLOADS -eq 1 ]]; then
        echo "WARNING: we have sha mismatch of $fname and skip downloads is set," >&2
        echo "         you should verify the integrity of this file." >&2
    else
        echo $cmd
        eval $cmd
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to download: >&2
            echo $url >&2
            echo
            echo Possible causes: \( low disk space\)? >&2
            echo 2. Verify that you have enough disk space, and run the script again. >&2
            echo 3. Download it manually using the curl command above. >&2
            exit $EXIT_FAIULRE
        fi
        dst_sha=$(sha256sum "$fname" | cut -f1 -d" ")
    fi

    if [[ "$src_sha" != "$dst_sha" ]]; then
        if [[ $FAIL_ON_SHA -eq 1 ]]; then
            echo ERROR: sha256sum mismatch, expected: $src_sha, actual: $dst_sha
            exit $EXIT_FAILURE
        else
            echo WARNING: found sha256sum mismatch, expected: $src_sha, actual: $dst_sha
        fi
    fi
}

_fetch_user_mode()
{
    echo Downloading user mode driver...

    _fetch_and_compare_sha $SRB_5_0_SHA $SRB_5_0

    cmd="unzip -o $(basename $SRB_5_0)"
    echo $cmd
    eval $cmd
    if [[ $? -ne 0 ]]; then
        echo ERROR: failed to unzip user-mode driver. >&2
        echo Make sure you have enough disk space and try again. >&2
        exit $EXIT_FAIULRE
    fi
}

_deploy_rpm()
{
    # On a CentOS 7.2 machine with Intel Parallel Composer XE 2017
    # installed we got conflicts when trying to deploy these rpms.
    # If that happens to you too, try again with:
    # IGFX_RPM_FLAGS="--force" sudo -E ./install_OCL_driver.sh install
    #
    cmd="rpm $IGFX_RPM_FLAGS -ivh $1"
    echo $cmd
    eval $cmd
}

_deploy_deb()
{
    cmd="dpkg -i $1"
    echo $cmd
    eval $cmd
}

_install_user_mode_centos()
{
    _deploy_rpm "*$RELEASE_NUM*.rpm"
    if [[ $? -ne 0 ]]; then
        echo ERROR: failed to install rpms $cmd erroe  >&2
        echo Make sure you have enough disk space or fix the problem manually and try again. >&2
        exit $EXIT_FAIULRE
    fi
}

_install_user_mode_generic()
{
    if [[ ! -d ./intel-opencl ]]; then
        echo mkdir intel-opencl
        mkdir intel-opencl || exit $?
    fi

    ARCHIVES=("intel-opencl-cpu-$BUILD_ID.x86_64.tar.xz"
              "intel-opencl-devel-$BUILD_ID.x86_64.tar.xz"
              "intel-opencl-$BUILD_ID.x86_64.tar.xz")

    for a in "${ARCHIVES[@]}"; do
        echo tar -C intel-opencl -Jxf $a
        tar -C intel-opencl -Jxf $a || exit $EXIT_FAILURE
    done

    echo "cp -R intel-opencl/* /"
    cp -R intel-opencl/* / || exit $?
    echo ldconfig
    ldconfig || exit $?
}

_uninstall_user_mode_centos()
{
    echo Looking for previously installed user-mode driver...
    echo "rpm -qa | grep intel-opencl"
    rpm -qa | grep intel-opencl
    if [[ $? -eq 0 ]]; then
        echo Found installed user-mode driver, performing uninstall...
        cmd='rpm -e --nodeps $(rpm -qa | grep intel-opencl)'
        echo $cmd
        eval $cmd
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to uninstall existing user-mode driver. >&2
            echo Please try again manually and run the script again. >&2
            exit $EXIT_FAIULRE
        fi
    fi
}

_uninstall_user_mode_generic()
{
    echo Looking for previously installed user-mode driver...

    FILES=("/etc/ld.so.conf.d/libintelopencl.conf"
           "/etc/OpenCL/vendors/intel.icd"
           "/etc/profile.d/libintelopencl.sh"
           "/opt/intel/opencl")

    for file_ in "${FILES[@]}"; do
        echo rm -rf $file_
        rm -rf $file_
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to remove existing user-mode driver. >&2
            echo Please try again manually and run the script again. >&2
            exit $EXIT_FAIULRE
        fi
    done
}

_uninstall_user_mode()
{
    if [[ $DISTRO == "centos" ]]; then
        _uninstall_user_mode_centos
    else
        _uninstall_user_mode_generic
    fi
}

_is_srb50_umd_installed()
{
    local ret=1

    if [[ $DISTRO == "centos" ]]; then
        echo "rpm -qa | grep $BUILD_ID"
        rpm -qa | grep $BUILD_ID
        [[ $? -eq 0 ]] && ret=0
    else
        # TODO: any way to query installed version?
        :
    fi

    return $ret
}

install_user_mode()
{
    echo Installing user mode driver...
    _fetch_user_mode

    if _is_srb50_umd_installed; then
        echo SRB5.0 user-mode driver already installed, skipping...
        return
    fi
    _uninstall_user_mode

    if [[ $DISTRO == "centos" ]]; then
        _install_user_mode_centos
    else
        _install_user_mode_generic
    fi
}

_is_kernel_installed()
{
    local ret=1

    if [[ $DISTRO == "centos" ]]; then
       num_rpms=$(uname -a | grep -E 'kernel-4.7.0.intel.r*|kernel-devel-4.7.0.intel.r*|*4.7.0.intel.r.*'| wc -w)
       #rpm -qa | grep -E 'kernel-4.7.0.intel.r*|kernel-devel-4.7.0.intel.r*|' | wc -w)
        [[ $num_rpms -gt 2 ]] && ret=0 || ret=1
    elif [[ $DISTRO == ubuntu ]]; then
        num_debs=$(uname -a | grep -E 'kernel-4.7.0.intel.r*|kernel-devel-4.7.0.intel.r*|*4.7.0.intel.r.*'|wc -w)
        [[ $num_debs -gt 2 ]] && ret=0 || ret=1
    else
        [ -d /usr/src/kernels/$LINUX_KERNEL_UNAME* ] && ret=0
    fi

    return $ret
}

_build_targets()
{
    declare -ir num_cpus=$(cat /proc/cpuinfo | grep -c processor)

    local TARGETS=("${!1}")

    for target in "${TARGETS[@]}"; do
        cmd="make -j$num_cpus $target"
        echo $cmd
        eval $cmd
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to build the kernel. >&2
            echo Make sure you have enough disk space and try again. >&2
            echo $cmd >&2
            exit $EXIT_FAIULRE
        fi
    done
}


_build_kernel()
{
    # Using [rpm|deb]-pkg instead of binrpm-pkg to allow re-distribution
    # of the kernel sources and headers as well as the binary rpm.
    local TARGETS=

    if [[ $DISTRO == "ubuntu" ]]; then
        TARGETS=("deb-pkg")
    elif [[ $DISTRO == "centos" ]]; then
        TARGETS=("rpm-pkg")
    else
        TARGETS=("" "modules")
    fi

    _build_targets TARGETS[@]
}

_is_package_installed()
{
    if [[ $DISTRO == "centos" ]]; then
        cmd="rpm -qa | grep $1"
    else
        cmd="dpkg-query -W -f='${binary:Package}\n' $pkg"
    fi
    echo $cmd
    eval $cmd
}

_deploy_kernel_pkg()
{
    local pkg_dir=
    [[ $DISTRO == "centos" ]] && pkg_dir="$RPMBUILD_DIR/RPMS/x86_64" || pkg_dir=..

    local version=""
    if [[ ! -f  .version ]]; then
        echo "WARNING: unable to locate .version file under $PWD" >&2
        echo "         the script will pick the most recent package" >& 2
    else
        version=$(cat .version)
    fi

    for pkg in "${PKGS[@]}"; do
        echo Looking for $pkg...
        if _is_package_installed $pkg; then
            echo Already found $pkg installed, skipping...
        else
            local pkg_path=
            if [[ $DISTRO == "centos" ]]; then
                pkg_path=$(ls -1 -r --sort=time $pkg_dir/$pkg*-$version*.rpm)
            else
                pkg_path=$(ls -1 -r --sort=time $pkg_dir/$pkg*-$version*.deb | grep -v dbg)
            fi
            if [[ -z $pkg_path ]]; then
                echo ERROR: failed to locate $pkg under $pkg_dir >&2
                echo Please remove $PWD/$KERNEL_BUILD_MARKER to force a re-build of the kernel, and launch this script again. >&2
                exit $EXIT_FAILURE
            fi

            if [[ $DISTRO == "centos" ]]; then
                _deploy_rpm "$pkg_path"
            else
                _deploy_deb "$pkg_path"
            fi

            if [[ $? -ne 0 ]]; then
                echo ERROR: failed to deploy $pkg_path. >&2
                echo Make sure you have enough disk space and try again manually. >&2
                exit $EXIT_FAIULRE
            fi
        fi
    done
}

_deploy_kernel_generic()
{
    local TARGETS=("modules_install" "install")
    _build_targets TARGETS[@]
}

_deploy_kernel()
{
    if [[ $DISTRO == "centos" || $DISTRO == "ubuntu" ]]; then
        _deploy_kernel_pkg
    else
        _deploy_kernel_generic
    fi
}

_build_and_deploy_kernel_mode()
{
    declare -r patch_mark='.intel_opencl_patched'
    declare -r tag_mark='.intel_opencl_tagged'
    declare -r version_mark='.intel_version_removed'
    declare -r build_mark=$KERNEL_BUILD_MARKER
    declare -ir num_cpus=$(cat /proc/cpuinfo | grep -c processor)
    local prev_home=

    if _is_kernel_installed; then
        echo Kernel 4.7 with Intel patches is already installed, skipping build and deploy...
        return
    fi

    if [[ $DISTRO == "centos" ]]; then
        # This is a hack since rpmdev-setuptree doesn't accept working
        # space as a parameter.
        prev_home="$HOME"
        export HOME=$(dirname "$RPMBUILD_DIR")
        rpmdev-setuptree
    fi

    if [[ -f $patch_mark ]]; then
        echo Kernel already patched, skipping patch...
    else
        if [[ ! -f /opt/intel/opencl/kernel-4.7.patch ]]; then
            echo ERROR: failed to find patch Linux 4.7 kernel: >&2
            echo '/opt/intel/opencl/kernel-4.7.patch' >&2
            echo This probably means user-space packages were not properly installed. >&2
            echo Please try to install them using this script, or try re-installing them manually. >&2
            exit $EXIT_FAIULRE
        fi

        echo 'patch -p1 < /opt/intel/opencl/kernel-4.7.patch'
        patch -p1 < /opt/intel/opencl/kernel-4.7.patch
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to patch Linux 4.7 kernel. >&2
            echo This probably means user-space packages were not properly installed. >&2
            echo Please try to install them using this script, or try re-installing them manually. >&2
            exit $EXIT_FAIULRE
        fi
        touch $patch_mark
    fi

    local need_make_olddefconfig=0

    if [[ -f .config ]]; then
        echo Kernel .config file exists, skipping .config creation...
    else
        # Use the currently running Linux kernel as a template
        echo 'cat /boot/config-`uname -r` > .config'
        cat /boot/config-`uname -r` > .config
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to write configuration file for Linux 4.7 kernel. >&2
            exit $EXIT_FAIULRE
        fi
        need_make_olddefconfig=1
    fi

    if [[ -f $tag_mark ]]; then
        echo Kernel already tagged, skipping tagging...
    else
        # Tag the patched kernel to provide easy identification.
        cmd="perl -pi -e 's/.*CONFIG_LOCALVERSION=.*/CONFIG_LOCALVERSION=\".intel.r$RELEASE_NUM\"/' .config"
        echo $cmd
        eval $cmd
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to tag the Linux 4.7 kernel. >&2
            exit $EXIT_FAIULRE
        fi
        touch $tag_mark
    fi

    if [[ $need_make_olddefconfig -eq 1 ]]; then
        echo 'make olddefconfig'
        make olddefconfig
    fi

    if [[ ! -f $version_mark ]]; then
        rm -f .version
        touch $version_mark
    fi

    local kernel_built
    if [[ -f $build_mark ]]; then kernel_built=1; else kernel_built=0; fi

    if [[ $kernel_built -eq 0 && $BUILD_KERNEL -eq 1 ]]; then
        echo Building the kernel...
        _build_kernel
        touch $build_mark
    else
        echo Skipping kernel build \($kernel_built\)...
    fi

    [[ $DISTRO == "centos" ]] && export HOME="$prev_home"

    echo Deploying kernel...

    _deploy_kernel
}

_fetch_kernel_mode()
{
    echo Downloading Linux kernel 4.7...

    _fetch_and_compare_sha $KERNEL_4_7_SHA $KERNEL_4_7
}

install_kernel_mode()
{
    _fetch_kernel_mode

    echo Installing Linux kernel 4.7...

    if [[ -d linux-4.7 ]]; then
        echo "linux-4.7 kernel directory exists, skipping extract..."
    else
        echo "tar -Jxf linux-4.7.tar.xz"
        tar -Jxf linux-4.7.tar.xz
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to extract Linux 4.7 kernel >&2
            echo This could be due to insufficient disk space. Please check and try again. >&2
            exit $EXIT_FAIULRE
        fi
    fi

    pushd linux-4.7
    _build_and_deploy_kernel_mode
    popd
}

_uninstall_kernel_pkg_based()
{
    for pkg in "${PKGS[@]}"; do
        echo Looking for $pkg...
        local pkgs=
        if [[ $DISTRO == "centos" ]]; then
            pkgs=$(rpm -qa | grep $pkg)
        else
            pkgs=$(dpkg-query -W -f='${binary:Package}\n' $pkg)
        fi
        if [[ $? -eq 0 ]]; then
            echo Found $pkgs installed, uninstalling...
            if [[ $DISTRO == "centos" ]]; then
                rpm -e $pkgs
            else
                dpkg --purge $pkgs
            fi
            if [[ $? -ne 0 ]]; then
                echo "ERROR: unable to remove $pkgs" >&2
                echo "       please resolve it manually and try to launch the script again." >&2
                exit $EXIT_FAILURE
            fi
        fi
    done

}

_uninstall_kernel_mode()
{
    local kernel_in_use=0
    if [[ $DISTRO == "centos" ]]; then
        if echo ${CENTOS_RPMS[0]} | grep -q $(uname -r); then
            kernel_in_use=1
        fi
    elif [[ $DISTRO == "ubuntu" ]]; then
        if echo ${DEBIAN_DEBS[0]#linux-image-} | grep -q $(uname -r); then
            kernel_in_use=1
        fi
    fi

    if [[ $kernel_in_use -eq 1 ]]; then
        echo "ERROR: cannot remove actively used kernel $(uname -r)." >&2
        echo "       please boot into a different kernel and run the script again." >&2
        exit $EXIT_FAILURE
    fi

    if [[ $DISTRO == "ubuntu" || $DISTRO == "centos" ]]; then
        _uninstall_kernel_pkg_based
    elif _is_kernel_installed; then
        echo "WARNING: cannot remove kernel $LINUX_KERNEL_UNAME" >& 2
        echo "         you will need to remove it manually." >& 2
    fi

    if [[ $DISTRO == "centos" ]]; then
        cmd="/usr/sbin/grub2-mkconfig --output=/etc/grub2.cfg"
        echo $cmd
        eval $cmd
        if [[ $? -ne 0 ]]; then
            echo "WARNING: failed to run grub2-mkconfig" >&2
            echo "         you might have to resolve it manually." >&2
        fi
    fi
}

summary()
{
    echo
    if [[ $INSTALL_MODE -eq 1 ]]; then
        echo Installation completed successfully.
        echo
        echo Next steps:
        echo "1. Add OpenCL users to the video group: 'sudo usermod -a -G video USERNAME'"
        echo "   e.g. if the user running OpenCL host applications is foo, run: sudo usermod -a -G video foo"
        echo
        echo "2. If you have Intel Pentium J4000 or Intel Celeron J3000, you will need to add:"
        echo "   i915.preliminary_hw_support=1"
        echo "   to the 4.7 kernel command line, in order to enable OpenCL functionality for these platforms."
        echo
        echo "3. Reboot into the patched 4.7 kernel"
        if [[ $DISTRO == "ubuntu" ]]; then
            echo
            echo "HINT: to boot into the 4.7 kernel do the following:"
            echo "      1) Hold the \"shift\" button during boot"
            echo "      2) When the GRUB menu appears, select \"Advanced options for Ubuntu\""
            echo "      3) Select the Linux 4.7.0.intel.r5.0 kernel from the list"
            echo
        fi
    else
        [[ -d $WORKSPACE ]] && echo Workspace dir has to be manually removed: $WORKSPACE
        echo Uninstall completed successfully.
        echo
    fi

    echo
}

prompt_for_action()
{
    echo "Intel Graphics Driver Installer for OpenCL on CentOS"
    echo
    echo -n "Running on "
    if [[ $DISTRO == "ubuntu" ]]; then
        echo "Ubuntu $UBUNTU_VERSION"
    elif [[ $DISTRO == "centos" ]]; then
        cat /etc/centos-release
    else
        echo "Generic distribution"
    fi
    echo
    if [[ $INSTALL_MODE -eq 1 ]]; then
        echo "The installer will download (unless they already exist):"
        echo "* OpenCL user-mode driver (87MiB) "
        echo "* Linux 4.7 kernel (66MiB) "
        echo
        echo "Setup requires ~10GiB disk space, and takes ~1h on a 4-cores machine."
        echo "(~8.9GiB for building the Linux kernel, ~1GiB for other files)"
        echo
    else
        echo "The installer will remove (if needed):"
        echo "* OpenCL user-mode driver"
        echo "* Installed patched Linux 4.7 kernel"
        echo
    fi

    if [[ $INTERACTIVE -eq 1 ]]; then
        read -p "Do you want to continue? [y/n] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[yY]$ ]]; then
            echo "Aborting."
            exit $EXIT_FAILURE
        fi
    fi
}

check_root_access()
{
    if [[ $EUID -ne 0 ]]; then
        echo "ERROR: you must run this script as root." >&2
        echo "Please try again with "sudo -E $0", or as root." >&2
        exit $EXIT_FAILURE
    fi
}

create_workspace()
{
    if [[ ! -d $WORKSPACE ]]; then
        echo Creating workspace at "$WORKSPACE"...
        mkdir -p "$WORKSPACE"
    else
        echo Found existing workspace at "$WORKSPACE"...
    fi

    if [[ ! -d $WORKSPACE ]]; then
        echo ERROR: failed to create workspace $WORKSPACE. >&2
        echo Please try to create it manually and then run the script again. >&2
        exit $EXIT_FAIULRE
    fi
}

add_user_to_video_group()
{
    local real_user=$(logname 2>/dev/null || echo ${SUDO_USER:-${USER}})
    echo
    echo Adding $real_user to the video group...
    usermod -a -G video $real_user
    if [[ $? -ne 0 ]]; then
        echo WARNING: unable to add $real_user to the video group >&2
    fi
}

_check_distro_version()
{
    if [[ $DISTRO == centos ]]; then
        CENTOS_MINOR=$(sed 's/CentOS Linux release 7\.\([[:digit:]]\+\).\+/\1/' /etc/centos-release)
        if [[ $? -ne 0 ]]; then
            echo ERROR: failed to obtain CentOS version minor. >&2
            echo This script is supported only on CentOS 7 and above. >&2
            exit $EXIT_FAIULRE
        fi
    elif [[ $DISTRO == ubuntu ]]; then
        grep -q -E "14.04" /etc/lsb-release && UBUNTU_VERSION="14.04"
        grep -q -E "16.04" /etc/lsb-release && UBUNTU_VERSION="16.04"
        if [[ -z $UBUNTU_VERSION ]]; then
            echo "ERROR: this script is supported only on Ubuntu 14.04 and 16.04." >&2
            exit $EXIT_FAILURE
        fi
    fi
}

distro_init()
{
    if [[ $DISTRO == "auto" ]]; then
        if [[ -f /etc/centos-release ]]; then
            DISTRO="centos"
        elif [[ -f /etc/lsb-release ]]; then
            DISTRO="ubuntu"
        else
            DISTRO="generic"
        fi
    fi

    [[ $CHECK_DISTRO_VER -eq 1 ]] && _check_distro_version

    if [[ $DISTRO == "centos" ]]; then
        PKGS=("${CENTOS_RPMS[@]}")
        RPMBUILD_DIR="$WORKSPACE/rpmbuild"
    elif [[ $DISTRO == "ubuntu" ]]; then
        PKGS=("${DEBIAN_DEBS[@]}")
    fi
}

usage()
{
    echo "Usage: $0 <install|uninstall> [OPTION]..."
    echo "Try '$0 --help' for more information."
}

help_()
{
    echo -e "Intel Graphics Driver Installer for OpenCL on Linux\n"
    echo -e "Usage: $0 <install|uninstall> [OPTION]...\n"
    echo -e "Installs/Uninstalls the OpenCL Graphics Driver (user-mode) and the Linux 4.7 kernel "
    echo -e "with some patches on top.\n"
    echo -e "OPTIONS:"
    echo -e "  --workspace <DIR>   - sets the path to a dir used for downloading and unpacking "
    echo -e "                        the user-mode driver as well as the Linux 4.7 kernel."
    echo -e "                        (default: $WORKSPACE)."
    echo -e "  --skip-downloads    - skip downloading user mode packges and Linux 4.7 kernel,"
    echo -e "                        as well as any package installations (yum/apt-get)."
    echo -e "                        very useful if you experience connectivity issues (default: false)."
    echo -e "  -d, --distro        - CentOS, Ubuntu, generic or auto. if unset, inferred automatically."
    echo -e "                        (default: auto)"
    echo -e "  -y, --assumeyes     - answer yes for install/uninstall prompt and all system upgrades"
    echo -e "                        (yum/apt-get) questions (default: false)."
    echo -e "                        only when unset and script runs from a tty, prompts the user"
    echo -e "                        for packages (yum/apt-get) installations.\n"
    echo -e "e.g. $0 install"
    echo -e "e.g. $0 install --skip-downloads"
    echo -e "e.g. $0 install --workspace /tmp/intel-opencl"
    echo -e "e.g. $0 install -y"
    echo -e "e.g. $0 uninstall"
}

parse_args()
{
    [[ $# -eq 0 ]] && usage && exit 0

    local distro="auto"

    while [[ $# -gt 0 ]]; do
        opt="$1"
        case $opt in
            -h|--help)
                help_
                exit 0
                ;;
            -d|--distro)
                if [[ -n $2 ]]; then
                    distro=$2
                    shift
                else
                    echo "ERROR: \"$opt\" requires a distro name: CentOS, Ubuntu or auto." >&2
                    exit $EXIT_FAILURE
                fi
                ;;
            -y|--assumeyes)
                INTERACTIVE=0
                ;;
            install)
                INSTALL_MODE=1
                ;;
            uninstall)
                INSTALL_MODE=0
                ;;
            --skip-downloads)
                SKIP_DOWNLOADS=1
                ;;
            --workspace)
                if [[ -n $2 ]]; then
                    WORKSPACE=$2
                    shift
                else
                    echo 'ERROR: "--workspace" requires a non-empty path.' >&2
                    exit $EXIT_FAILURE
                fi
                ;;
            *)
                echo -e "ERROR: unknown parameter $1 \n" >&2
                usage
                exit $EXIT_FAILURE
                ;;
        esac
        shift
    done

    DISTROS=("ubuntu" "centos" "generic" "auto")
    distro=$(echo $distro | tr '[:upper:]' '[:lower:]')
    for d in "${DISTROS[@]}"; do
        [[ $d == $distro ]] && DISTRO=$d
    done

    if [[ -z $DISTRO ]]; then
        echo "ERROR: invalid distro name \"$distro\". valid values are: CentOS, Ubuntu, generic and auto." >&2
        exit $EXIT_FAILURE
    fi

    if [[ -z $INSTALL_MODE ]]; then
        echo "ERROR: you must select either 'install' or 'uninstall'." >&2
        usage
        exit $EXIT_FAILURE
    fi

    WORKSPACE=$(readlink -f "$WORKSPACE")

    # Prompt only on interactive shells.
    prog=$(basename "$0")
    [[ ! -t 1 ]] && echo "$prog: input not from terminal, setting -y=1" && INTERACTIVE=0
}

uninstall()
{
    echo Uninstalling user-mode driver...
    _is_srb50_umd_installed && _uninstall_user_mode

    echo Uninstalling patched Linux 4.7 kernel...
    _uninstall_kernel_mode
}

install()
{
    create_workspace
    pushd "$WORKSPACE"
    [[ $SKIP_DOWNLOADS -eq 0 ]] && install_prerequisites
    install_user_mode


    read -p "Patch/rebuild kernel and install KMD? (Y/n) " -n 1 -r

    echo
    echo $REPLY
    if [[ !  $REPLY =~ ^[nN]$ ]]; then
        install_kernel_mode
    else
        echo "skipping KMD install"
    fi
    
    add_user_to_video_group
    popd
}

main()
{
    parse_args "$@"
    distro_init
    check_root_access
    prompt_for_action
    if [[ $INSTALL_MODE -eq 1 ]]; then
        install
    else
        uninstall
    fi
    summary
}

[[ "$0" == "$BASH_SOURCE" ]] && main "$@"

