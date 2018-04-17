FEATUREFLAGS= -std=c++0x -pthread -fopenmp
CFLAGS=-Wall -Wno-address $(FEATUREFLAGS) -c
LDFLAGS=$(FEATUREFLAGS)
LIBRARYINCLUDESEND=

CXX=g++


$(info [1;33mCompile flags:  $(CFLAGS)[0m)
$(info [1;34mLinker flags part 1:  $(LDFLAGS))
$(info [1;34mLinker flags part 2: $(LIBRARYINCLUDESEND)[0m)

#if this is missing something, add it, or, ls | grep cpp | xargs echo
SOURCES=\
./src/main.cpp

OBJECTS=$(SOURCES:.cpp=.o) 
DEPS=$(SOURCES:.cpp=.d)

all: directories kanban_gpu 
directories: build
bin:
	mkdir ./build

bin_calculator: $(OBJECTS)
	$(CXX) $(LDFLAGS) $(OBJECTS) -o ./bin/calculator $(LIBRARYINCLUDESEND)

testrun: bin/calculator
	time ./bin/calculator test

%.o:%.cpp
	$(CXX) $(CFLAGS) -MMD -MP $< -o $@

clean:
	rm -f $(OBJECTS) $(DEPS)

-include $(DEPS)
