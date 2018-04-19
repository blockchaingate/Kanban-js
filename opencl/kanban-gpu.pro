TEMPLATE = app
CONFIG += console c++11
CONFIG -= app_bundle
CONFIG -= qt

SOURCES += \
main.cpp \
    gpu.cpp

LIBS+=-lOpenCL

HEADERS += \
    cl/sha256GPU.cl
