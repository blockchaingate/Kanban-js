FEATUREFLAGS= -std=c++0x -pthread
CFLAGS=-Wall -Wno-address $(FEATUREFLAGS) -c
LDFLAGS=$(FEATUREFLAGS)
LIBRARYINCLUDESEND=

LIBRARYINCLUDESEND+=-lOpenCL -lstdc++fs

CXX=g++

$(info [1;33mcurrent_dir: $(shell pwd)[0m)

$(info current_dir: $(current_dir))
$(info [1;33mCompile flags:  $(CFLAGS)[0m)
$(info [1;34mLinker flags part 1:  $(LDFLAGS))
$(info [1;34mLinker flags part 2: $(LIBRARYINCLUDESEND)[0m)


#if this is missing something, add it, or, ls | grep cpp | xargs echo
SOURCES=\
		main.cpp \
		gpu.cpp \
		server.cpp \
		miscellaneous.cpp \
		test.cpp \
		cl/secp256k1_to_string_methods.cpp \
		secp256k1_interface.cpp \
		cl/secp256k1_cpp.cpp

OBJECTS=$(SOURCES:.cpp=.o) 
DEPS=$(SOURCES:.cpp=.d)

all: directories kanban_gpu 
directories: build
build:
	mkdir -p ../build
#	$(info current_dir: $(shell pwd))

kanban_gpu: $(OBJECTS)
	$(CXX) $(LDFLAGS) $(OBJECTS) -o ../build/kanban-gpu $(LIBRARYINCLUDESEND)

testrun: build
	time ../build/kanban-gpu test

%.o:%.cpp
	$(CXX) $(CFLAGS) -MMD -MP $< -o $@

clean:
	rm -f $(OBJECTS) $(DEPS)

-include $(DEPS)
