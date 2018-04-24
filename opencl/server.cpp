#include "server.h"
#include "logging.h"
#include "miscellaneous.h"

//#include <stdio.h>
//#include <stdlib.h>
#include <string.h>
#include <unistd.h> // <- file descriptor operations
//#include <sys/types.h>
#include <sys/socket.h> //<- sockets and related data structures
#include <netinet/in.h> // <- addresses and similar
#include <netdb.h> //<-addrinfo and related data structures defined here

Logger logServer("../logfiles/logServer.txt");

Server::Server()
{
  this->flagInitialized = false;
  this->listeningSocketData = - 1;
  this->listeningSocketMetaData = - 1;
  this->fileDescriptorData = - 1;
  this->fileDescriptorMetaData = - 1;
  this->portMetaData = - 1;
  this->portData = - 1;
  this->portOutputData = - 1;
  this->currentMessageLength = - 1;
}

Server::~Server()
{
  if (this->listeningSocketData >= 0)
    close(this->listeningSocketData);
  if (this->listeningSocketMetaData >= 0)
    close(this->listeningSocketMetaData);
  if (this->listeningSocketOutputData >= 0)
    close(this->listeningSocketOutputData);

  if (this->fileDescriptorData >= 0)
    close (this->fileDescriptorData);
  if (this->fileDescriptorMetaData >= 0)
    close (this->fileDescriptorMetaData);
  if (this->fileDescriptorOutputData >= 0)
    close (this->fileDescriptorOutputData);
  this->listeningSocketData = - 1;
  this->listeningSocketMetaData = - 1;
  this->listeningSocketOutputData = - 1;
  this->fileDescriptorData = - 1;
  this->fileDescriptorMetaData = - 1;
  this->fileDescriptorOutputData = - 1;
}

bool Server::initialize()
{
  if (this->flagInitialized)
    return true;
  this->theGPU = std::make_shared<GPU>();
  this->theGPU->initializeKernels();
  if (!this->initializePorts())
    return false;
  logServer << "Server ports opened ..." << Logger::endL;
  if (!this->listenAll())
    return false;
  if (!this->acceptAll())
    return false;

  logServer << "connections accepted." << Logger::endL;
  return true;
}

bool Server::Run()
{
  if (!this->initialize())
    return false;
  while (this->RunOnce())
  {
  }
  return false;
}

std::vector<std::string> portsToTryMetaData = {"49201"};
std::vector<std::string> portsToTryData = {"48201"};
std::vector<std::string> portsToTryOutputData = {"47201"};

bool Server::initializeOneSocketAndPort(int& outputSocket, std::string& outputPort, std::vector<std::string>& portsToTry)
{
  addrinfo hints;
  addrinfo *serverInfo = 0;
  addrinfo *p = 0;
  memset(&hints, 0, sizeof hints);
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_flags = AI_PASSIVE; // use my IP
  int yes = 1;
  for (unsigned i = 0; i < portsToTry.size(); i ++)
  {
    outputPort = portsToTry[i];
    int rv = getaddrinfo(NULL, portsToTry[i].c_str(), &hints, &serverInfo);
    if (rv != 0)
    {
      logServer << "Getaddrinfo failed. " << gai_strerror(rv) << Logger::endL;
      return false;
    }
    for (p = serverInfo; p != NULL; p = p->ai_next)
    {
      outputSocket = socket(p->ai_family, p->ai_socktype, p->ai_protocol);
      if (outputSocket == - 1)
      {
        logServer << "Error: socket failed.\n" << Logger::endL;
        continue;
      }
      if (setsockopt(outputSocket, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int)) == - 1)
      {
        logServer << "Error: setsockopt failed, error: \n" << strerror(errno) << Logger::endL;
        return false;
      }
      if (bind(outputSocket, p->ai_addr, p->ai_addrlen) == - 1)
      {
        close(outputSocket);
        outputSocket= - 1;
        logServer << "Error: bind failed at port: " << portsToTry[i] << Logger::endL;
        continue;
      }
      return true;
    }
  }
  return false;
}

bool Server::initializePorts()
{
  if (!this->initializeOneSocketAndPort(this->listeningSocketMetaData, this->portMetaData, portsToTryMetaData))
    return false;
  if (!this->initializeOneSocketAndPort(this->listeningSocketData, this->portData, portsToTryData))
    return false;
  if (!this->initializeOneSocketAndPort(this->listeningSocketOutputData, this->portOutputData, portsToTryOutputData))
    return false;
  return true;
}

bool Server::acceptAll()
{
  if (!this->acceptOneSocket(this->listeningSocketMetaData, this->fileDescriptorMetaData, this->portMetaData))
    return false;
  if (!this->acceptOneSocket(this->listeningSocketData, this->fileDescriptorData, this->portData))
    return false;
  if (!this->acceptOneSocket(this->listeningSocketOutputData, this->fileDescriptorOutputData, this->portOutputData))
    return false;
  return true;
}

bool Server::acceptOneSocket(int theSocket, int& outputFileDescriptor, const std::string& port)
{
  logServer << "About to accept socket, port: " << theSocket << ", " << port << Logger::endL;
  struct sockaddr cli_addr;
  socklen_t clilen;

  clilen = sizeof(cli_addr);
  outputFileDescriptor = accept(theSocket, &cli_addr, &clilen);
  logServer << "Accepted socket, port: " << theSocket << ", " << port << Logger::endL;
  if (outputFileDescriptor < 0)
  {
    logServer << "Error on accept: " << port << Logger::endL;
    return false;
  }
  logServer << "Successfully accepted: " << port << Logger::endL;
  return true;
}

bool Server::listenOneSocket(int theSocket, int& outputFileDescriptor, const std::string& port)
{ (void) outputFileDescriptor;
  logServer << "Listening to port: " << port << Logger::endL;
  int success = listen(theSocket, 100);
  logServer << "After listen function to port: " << port << Logger::endL;
  if (success != 0)
  {
    logServer << "Failed listening. " << strerror(errno);
    return false;
  }
  return true;
}

bool Server::listenAll()
{
  if (!this->listenOneSocket(this->listeningSocketMetaData, this->fileDescriptorMetaData, this->portMetaData))
    return false;
  if (!this->listenOneSocket(this->listeningSocketData, this->fileDescriptorData, this->portData))
    return false;
  if (!this->listenOneSocket(this->listeningSocketOutputData, this->fileDescriptorOutputData, this->portOutputData))
    return false;
  return true;
}

const int bufferSizeMain = 50000000; //50MB should be a good maximum for a single computational request, may need to be increased.
char bufferInputMain[bufferSizeMain];
char bufferOutputGPU[bufferSizeMain];

const int bufferSizeMetaData = 1000; //50MB should be a good maximum for a single computational request, may need to be increased.
char bufferInputMetaData[bufferSizeMetaData];


bool Server::ReadOneSmallString(std::string& output)
{
  int metaDataBytes = read(this->fileDescriptorMetaData, bufferInputMetaData, bufferSizeMetaData);
  if (metaDataBytes < 0)
  {
    logServer << "Failed to read metadata. " << Logger::endL;
    return false;
  }
  output.assign(bufferInputMetaData, metaDataBytes);
  return true;
}

bool Server::ReadNextMetaDataPiece(std::string& output)
{
  while (true)
  { auto theIndex = this->queueMetaData.find('\n');
    if (theIndex == std::string::npos)
    { std::string buffer;
      if (!this->ReadOneSmallString(buffer))
        return false;
      this->queueMetaData += buffer;
      continue;
    }
    output = this->queueMetaData.substr(0, theIndex);
    this->queueMetaData = this->queueMetaData.substr(theIndex + 1);
    break;
  }
  logServer << "Read meta data: " << output << Logger::endL;
  return true;
}

bool Server::ReadNextMetaData()
{
  if (!this->ReadNextMetaDataPiece(this->currentMessageLengthString))
    return false;
  if (!this->ReadNextMetaDataPiece(this->currentMessageId))
    return false;
  std::stringstream lengthReader(this->currentMessageLengthString);
  lengthReader >> this->currentMessageLength;
  return true;
}

bool Server::RunOnce()
{
  if (!this->ReadNextMetaData())
    return false;
  int numReadSoFar = 0;
  int lastReadBytes = 0;
  std::string currentMessage = "";
  logServer << "About to read main message, expecting: " << this->currentMessageLength << " bytes. " << Logger::endL;
  while (numReadSoFar < this->currentMessageLength)
  { lastReadBytes = read(this->fileDescriptorData, bufferInputMain, bufferSizeMain);
    logServer << "Just read: " << lastReadBytes << " bytes out of " << this->currentMessageLength << Logger::endL;
    numReadSoFar += lastReadBytes;
    if (lastReadBytes < this->currentMessageLength)
    {
      std::string incoming(bufferInputMain, lastReadBytes);
      currentMessage += incoming;
    }
  }
  std::shared_ptr<GPUKernel> theKernel = this->theGPU->theKernels[GPU::kernelSHA256];
  if (lastReadBytes == this->currentMessageLength)
  {
    theKernel->writeToBuffer(3, bufferInputMain, lastReadBytes);
    currentMessage.assign(bufferInputMain, lastReadBytes);
    logServer << "Writing " << lastReadBytes << " bytes. Message: " << currentMessage << Logger::endL;
  } else
  {
    theKernel->writeToBuffer(3, currentMessage);
    logServer << "Writing " << currentMessage << ". " << Logger::endL;
  }
  theKernel->writeArgument(0, 0);
  theKernel->writeArgument(1, numReadSoFar);
  theKernel->writeArgument(2, 0);
  cl_int ret = clEnqueueNDRangeKernel(
        this->theGPU->commandQueue, theKernel->kernel, 1, NULL,
        &theKernel->global_item_size, &theKernel->local_item_size, 0, NULL, NULL);
  if (ret != CL_SUCCESS)
  {
    logServer << "Failed to enqueue kernel. Return code: " << ret << ". ";
    return false;
  }
  cl_mem& result = theKernel->outputs[0]->theMemory;
  ret = clEnqueueReadBuffer(this->theGPU->commandQueue, result, CL_TRUE, 0, 32, bufferOutputGPU, 0, NULL, NULL);
  if (ret != CL_SUCCESS)
  { logServer << "Failed to read buffer. " << Logger::endL;
    return false;
  }
  std::string outputBinary(bufferOutputGPU, 32);
  std::stringstream output;
  output << "{\"id\":\"" << this->currentMessageId << "\", \"result\": \"" << Miscellaneous::toStringHex(outputBinary) << "\"}\n";

  //std::stringstream output;
  //output << "{\"id\":\"" << this->currentMessageId << "\", \"result\": \"received: " << numReadSoFar << " bytes\"}\n";

  logServer << "About to write: " << output.str() << Logger::endL;
  int numWrittenBytes = write(this->fileDescriptorOutputData, output.str().c_str(), output.str().size());
  if (numWrittenBytes < 0)
  {
    logServer << "Error writing bytes. " << Logger::endL;
    return false;
  }
  return true;
}
