#include "server.h"
#include "logging.h"
#include "miscellaneous.h"
#include "secp256k1_interface.h"
//#include <stdio.h>
//#include <stdlib.h>
#include <string.h>
#include <unistd.h> // <- file descriptor operations
//#include <sys/types.h>
#include <sys/socket.h> //<- sockets and related data structures
#include <netinet/in.h> // <- addresses and similar
#include <netdb.h> //<-addrinfo and related data structures defined here
#include <assert.h>

Logger logServer("../logfiles/logServer.txt", "[ServerGPU] ");

PipeBasic::PipeBasic(int inputCapacity, const std::string& inputName) {
  this->capacity = inputCapacity;
  this->length = 0;
  this->position = 0;
  this->fileDescriptor = - 1;
  this->buffer = new char[inputCapacity];
  this->name = inputName;
}

PipeBasic::~PipeBasic() {
  delete [] this->buffer;
  this->buffer = 0;
  if (this->fileDescriptor >= 0)
    close (this->fileDescriptor);
  this->fileDescriptor = -1;
}

MessagePipeline::MessagePipeline() {
  this->bufferCapacityData = 50000000;
  this->bufferCapacityMetaData = 1000000;
  //Pipe buffers start.
  this->inputMeta = new PipeBasic(this->bufferCapacityMetaData, "metaData");
  this->inputData = new PipeBasic(this->bufferCapacityData, "data");
  this->bufferOutputGPU = new char[this->bufferCapacityData];
  //Pipe buffers end.
}

Server::Server() {
  this->flagInitialized = false;
  this->listeningSocketData = - 1;
  this->listeningSocketMetaData = - 1;
  this->portMetaData = - 1;
  this->portData = - 1;
  this->portOutputData = - 1;
}

MessagePipeline::~MessagePipeline() {
  //Pipe buffers start.
  delete this->inputData;
  this->inputData = 0;
  delete this->inputMeta;
  this->inputMeta = 0;
  delete [] this->bufferOutputGPU;
  this->bufferOutputGPU = 0;
  //Pipe buffers end.
  if (this->fileDescriptorOutputData >= 0)
    close (this->fileDescriptorOutputData);
  this->fileDescriptorOutputData = - 1;
}

Server::~Server() {
  if (this->listeningSocketData >= 0)
    close(this->listeningSocketData);
  if (this->listeningSocketMetaData >= 0)
    close(this->listeningSocketMetaData);
  if (this->listeningSocketOutputData >= 0)
    close(this->listeningSocketOutputData);
  this->listeningSocketData = - 1;
  this->listeningSocketMetaData = - 1;
  this->listeningSocketOutputData = - 1;
}

bool Server::initialize() {
  if (this->flagInitialized)
    return true;
  logServer << "Creating GPU ..." << Logger::endL;
  this->theGPU = std::make_shared<GPU>();
  logServer << "GPU created, initializing kernels..." << Logger::endL;
  this->theGPU->initializeKernels();
  logServer << "Kernels initialized, initializing ports..." << Logger::endL;
  if (!this->initializePorts())
    return false;
  logServer << "Server ports opened ..." << Logger::endL;
  if (!this->listenAll())
    return false;
  if (!this->acceptAll())
    return false;

  logServer << "All connections accepted." << Logger::endL;
  return true;
}

bool Server::Run() {
  if (!this->initialize())
    return false;
  while (this->RunOnce()) {
  }
  return false;
}

std::vector<std::string> portsToTryMetaData = {"49201"};
std::vector<std::string> portsToTryData = {"48201"};
std::vector<std::string> portsToTryOutputData = {"47201"};

bool Server::initializeOneSocketAndPort(int& outputSocket, std::string& outputPort, std::vector<std::string>& portsToTry) {
  addrinfo hints;
  addrinfo *serverInfo = 0;
  addrinfo *p = 0;
  memset(&hints, 0, sizeof hints);
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_flags = AI_PASSIVE; // use my IP
  int yes = 1;
  for (unsigned i = 0; i < portsToTry.size(); i ++) {
    outputPort = portsToTry[i];
    int rv = getaddrinfo(NULL, portsToTry[i].c_str(), &hints, &serverInfo);
    if (rv != 0) {
      logServer << "Getaddrinfo failed. " << gai_strerror(rv) << Logger::endL;
      return false;
    }
    for (p = serverInfo; p != NULL; p = p->ai_next) {
      outputSocket = socket(p->ai_family, p->ai_socktype, p->ai_protocol);
      if (outputSocket == - 1) {
        logServer << "Error: socket failed.\n" << Logger::endL;
        continue;
      }
      if (setsockopt(outputSocket, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int)) == - 1) {
        logServer << "Error: setsockopt failed, error: \n" << strerror(errno) << Logger::endL;
        return false;
      }
      if (bind(outputSocket, p->ai_addr, p->ai_addrlen) == - 1) {
        close(outputSocket);
        outputSocket= - 1;
        logServer << "Error: bind failed at port: " << portsToTry[i] << ". " << strerror(errno) << Logger::endL;
        continue;
      }
      return true;
    }
  }
  return false;
}

bool Server::initializePorts() {
  if (!this->initializeOneSocketAndPort(this->listeningSocketMetaData, this->portMetaData, portsToTryMetaData))
    return false;
  if (!this->initializeOneSocketAndPort(this->listeningSocketData, this->portData, portsToTryData))
    return false;
  if (!this->initializeOneSocketAndPort(this->listeningSocketOutputData, this->portOutputData, portsToTryOutputData))
    return false;
  return true;
}

bool Server::acceptAll() {
  if (!this->acceptOneSocket(this->listeningSocketMetaData, this->thePipe.inputMeta->fileDescriptor, this->portMetaData))
    return false;
  if (!this->acceptOneSocket(this->listeningSocketData, this->thePipe.inputData->fileDescriptor, this->portData))
    return false;
  if (!this->acceptOneSocket(this->listeningSocketOutputData, this->thePipe.fileDescriptorOutputData, this->portOutputData))
    return false;
  return true;
}

bool Server::acceptOneSocket(int theSocket, int& outputFileDescriptor, const std::string& port) {
  logServer << "About to accept socket, port: " << theSocket << ", " << port << Logger::endL;
  struct sockaddr cli_addr;
  socklen_t clilen;

  clilen = sizeof(cli_addr);
  outputFileDescriptor = accept(theSocket, &cli_addr, &clilen);
  logServer << "Accepted socket, port: " << theSocket << ", " << port << Logger::endL;
  if (outputFileDescriptor < 0) {
    logServer << "Error on accept: " << port << Logger::endL;
    return false;
  }
  logServer << "Successfully accepted: " << port << Logger::endL;
  return true;
}

bool Server::listenOneSocket(int theSocket, int& outputFileDescriptor, const std::string& port) {
  (void) outputFileDescriptor;
  logServer << "Listening to port: " << port << Logger::endL;
  int success = listen(theSocket, 100);
  logServer << "After listen function to port: " << port << Logger::endL;
  if (success != 0) {
    logServer << "Failed listening. " << strerror(errno);
    return false;
  }
  return true;
}

bool Server::listenAll() {
  if (!this->listenOneSocket(this->listeningSocketMetaData, this->thePipe.inputMeta->fileDescriptor, this->portMetaData))
    return false;
  if (!this->listenOneSocket(this->listeningSocketData, this->thePipe.inputMeta->fileDescriptor, this->portData))
    return false;
  if (!this->listenOneSocket(this->listeningSocketOutputData, this->thePipe.fileDescriptorOutputData, this->portOutputData))
    return false;
  return true;
}

void MessageFromNode::reset() {
  this->id = "";
  this->length = - 1;
  this->command = "";
  this->theMessage = "";
}

bool PipeBasic::ReadMore() {
  if (this->position < this->length)
    return true;
  this->position = 0;
  this->length = 0;
  this->length = read(this->fileDescriptor, this->buffer, this->capacity);
  if (this->length < 0) {
    logServer << "Failed to read " << this->name << ". " << strerror(errno) << Logger::endL;
    return false;
  }
  if (this->length == 0) {
    logServer << "Error: got zero bytes from " << this->name << ". " << Logger::endL;
    return false;
  }
  return true;
}

char PipeBasic::GetChar() {
  if (this->position >= this->length) {
    logServer << "Pipe basic fatal error. " << Logger::endL;
    assert(false);
  }
  char result = this->buffer[this->position];
  this->position ++;
  return result;
}

bool MessagePipeline::ReadOne() {
  std::string currentMetaData;
  this->currentMessage.reset();
  while (true) {
    if (!this->inputMeta->ReadMore())
      return false;
    char currentChar = this->inputMeta->GetChar();
    if (currentChar != '\n') {
      currentMetaData.push_back(currentChar);
      continue;
    }
    if (this->currentMessage.length < 0) {
      std::stringstream lengthReader(currentMetaData);
      lengthReader >> this->currentMessage.length;
      if (this->currentMessage.length <= 0) {
        logServer << "Failed to read current message length, got: "<< this->currentMessage.length << ". " << Logger::endL;
        return false;
      }
      currentMetaData = "";
    } else if (currentMessage.command == "") {
      this->currentMessage.command = currentMetaData;
      currentMetaData = "";
    } else {
      this->currentMessage.id = currentMetaData;
      break;
    }
  }
  while (true) {
    if (!this->inputData->ReadMore())
      return false;
    int remainingLength = this->currentMessage.length - this->currentMessage.theMessage.size();
    if (this->inputData->position + remainingLength <= this->inputData->length) {
      this->currentMessage.theMessage.append(&this->inputData->buffer[this->inputData->position], remainingLength);
      this->inputData->position += remainingLength;
      break;
    }
    int numBytesThatCanBeRead = this->inputData->length - this->inputData->position;
    this->currentMessage.theMessage.append(& this->inputData->buffer[this->inputData->position], numBytesThatCanBeRead);
    this->inputData->position += numBytesThatCanBeRead;
  }
  this->messageQueue.push(this->currentMessage);
  return true;
}

bool MessagePipeline::ReadNext() {
  if (!this->messageQueue.empty())
    return true;
//  bool
  do {
    if (!this->ReadOne())
      return false;
  }
  while (this->inputMeta->position < this->inputMeta->length);
  return true;
}

bool Server::RunOnce() {
  if (!this->thePipe.ReadNext())
    return false;
  while (!this->thePipe.messageQueue.empty()) {
    MessageFromNode& theMessage = this->thePipe.messageQueue.front();
    if (!this->ExecuteNodeCommand(theMessage))
      return false;
    this->thePipe.messageQueue.pop();
  }
  return true;
}

bool Server::ExecuteNodeCommand(MessageFromNode &theMessage) {
  logServer << "Processing message: " << theMessage.id << ", " << "command: " << theMessage.command
  << ", " << theMessage.length << " bytes. " << Logger::endL;
  if (theMessage.command == "SHA256")
    return this->ExecuteSha256(theMessage);
  if (theMessage.command == "testBuffer")
    return this->ExecuteTestBuffer(theMessage);
  if (theMessage.command == "signOneMessage")
    return this->ExecuteSignOneMessage(theMessage);
  logServer << "Fatal error: unknown command. Message: " << theMessage.id << ", " << "command: " << theMessage.command
  << ", " << theMessage.length << " bytes. ";
  if (theMessage.length < 50)
    logServer << "Message: " << theMessage.theMessage;
  logServer << Logger::endL;
  return false;
}

bool Server::ExecuteSha256(MessageFromNode &theMessage) {
  std::shared_ptr<GPUKernel> theKernel = this->theGPU->theKernels[GPU::kernelSHA256];
  theKernel->writeToBuffer(4, theMessage.theMessage);
  theKernel->writeArgument(1, 0);
  theKernel->writeArgument(2, theMessage.length);
  theKernel->writeArgument(3, 0);
  cl_int ret = clEnqueueNDRangeKernel(
    this->theGPU->commandQueue, theKernel->kernel, 1, NULL,
    &theKernel->global_item_size, &theKernel->local_item_size, 0, NULL, NULL
  );
  if (ret != CL_SUCCESS) {
    logServer << "Failed to enqueue kernel. Return code: " << ret << ". ";
    return false;
  }
  cl_mem& result = theKernel->outputs[0]->theMemory;
  ret = clEnqueueReadBuffer(this->theGPU->commandQueue, result, CL_TRUE, 0, 32, this->thePipe.bufferOutputGPU, 0, NULL, NULL);
  if (ret != CL_SUCCESS) {
    logServer << "Failed to read buffer. " << Logger::endL;
    return false;
  }
  std::string outputBinary(this->thePipe.bufferOutputGPU, 32);
  std::stringstream output;
  output << "{\"id\":\"" << theMessage.id << "\", \"result\": \"" << Miscellaneous::toStringHex(outputBinary) << "\"}\n";

  logServer << "Computation " << theMessage.id << " completed, writing ..." << Logger::endL;
  int numWrittenBytes = write(this->thePipe.fileDescriptorOutputData, output.str().c_str(), output.str().size());
  logServer << "Computation " << theMessage.id << " completed and sent." << Logger::endL;
  if (numWrittenBytes < 0) {
    logServer << "Error writing bytes. " << Logger::endL;
    return false;
  }
  return true;
}

bool Server::ExecuteTestBuffer(MessageFromNode &theMessage) {
  std::shared_ptr<GPUKernel> theKernel = this->theGPU->theKernels[GPU::kernelTestBuffer];
  theKernel->writeToBuffer(0, theMessage.theMessage);
  cl_int ret = clEnqueueNDRangeKernel(
    this->theGPU->commandQueue, theKernel->kernel, 1, NULL,
    &theKernel->global_item_size, &theKernel->local_item_size, 0, NULL, NULL
  );
  if (ret != CL_SUCCESS) {
    logServer << "Failed to enqueue kernel. Return code: " << ret << ". ";
    return false;
  }
  std::stringstream output;
  output << "{\"id\":\"" << theMessage.id << "\", \"result\": \""
  << theMessage.length << " bytes successfully sent to GPU. No useful work performed.\"}\n";

  logServer << "Computation " << theMessage.id << " completed, writing ..." << Logger::endL;
  int numWrittenBytes = write(this->thePipe.fileDescriptorOutputData, output.str().c_str(), output.str().size());
  logServer << "Computation " << theMessage.id << " completed and sent." << Logger::endL;
  if (numWrittenBytes < 0) {
    logServer << "Error writing bytes. " << Logger::endL;
    return false;
  }
  return true;
}

bool Server::ExecuteSignOneMessage(MessageFromNode& theMessage) {
  if (theMessage.length != 32 * 3){
    logServer << "Sign one message: got message of length: " << theMessage.length
    << ", expected " << 32 * 3 << " bytes." << Logger::endL;
    return false;
  }
  logServer << "Got 96 bytes, as expected: " << Miscellaneous::toStringHex(theMessage.theMessage) << Logger::endL;

  unsigned char bufferInputs[32 * 3];
  Signature outputSignature;
  for (int i = 0; i < theMessage.length; i ++)
    bufferInputs[i] = theMessage.theMessage[i];
  if (!CryptoEC256k1GPU::signMessage(
    outputSignature.serialization,
    &outputSignature.size,
    &bufferInputs[0],
    &bufferInputs[32],
    &bufferInputs[64],
    *this->theGPU.get()
  ))
    return false;
  std::string outputSignatureString;
  outputSignatureString.resize(outputSignature.size);
  for (unsigned i = 0; i < outputSignature.size; i ++) {
    outputSignatureString[i] = outputSignature.serialization[i];
  }
  std::stringstream output;
  output << "{\"id\":\"" << theMessage.id << "\", \"result\": \"" << Miscellaneous::toStringHex(outputSignatureString) << "\"}\n";

  logServer << "Computation " << theMessage.id << " completed, writing ..." << Logger::endL;
  int numWrittenBytes = write(this->thePipe.fileDescriptorOutputData, output.str().c_str(), output.str().size());
  if (numWrittenBytes < 0) {
    logServer << "Error writing bytes. " << Logger::endL;
    return false;
  }
  logServer << "Computation " << theMessage.id << " completed and sent." << Logger::endL;
  return true;
}
