TEMPLATE = app
CONFIG += console c++11
CONFIG -= app_bundle
CONFIG -= qt

SOURCES += \
    main.cpp \
    gpu.cpp \
    server.cpp \
    miscellaneous.cpp \
    test.cpp \
    cl/secp256k1_c.cpp

LIBS+=-lOpenCL

HEADERS += \
    gpu.h \
    server.h \
    logging.h \
    miscellaneous.h \
    cl/secp256k1.h

DISTFILES += \
    cl/testBuffer.cl
