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

std::string Logger::colorNormal = "\e[39m";
std::string Logger::colorBlue = "\e[94m";

PipeBasic::PipeBasic(int inputCapacity, const std::string& inputName) {
  this->length = 0;
  this->position = 0;
  this->fileDescriptor = - 1;
  this->buffer.resize(inputCapacity);
  this->name = inputName;
}

PipeBasic::~PipeBasic() {
  if (this->fileDescriptor >= 0) {
    close (this->fileDescriptor);
  }
  this->fileDescriptor = - 1;
}

MessagePipeline::MessagePipeline() {
  this->bufferCapacityData = 50000000;
  this->bufferCapacityMetaData = 1000000;
  //Pipe buffers start.
  this->inputMeta = new PipeBasic(this->bufferCapacityMetaData, "metaData");
  this->inputData = new PipeBasic(this->bufferCapacityData, "data");
  this->bufferOutputGPU = new unsigned char[this->bufferCapacityData];
  this->bufferOutputGPU_second = new unsigned char[this->bufferCapacityData];
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
  delete [] this->bufferOutputGPU_second;
  this->bufferOutputGPU_second = 0;
  //Pipe buffers end.
  if (this->fileDescriptorOutputData >= 0) {
    close (this->fileDescriptorOutputData);
  }
  this->fileDescriptorOutputData = - 1;
}

Server::~Server() {
  if (this->listeningSocketData >= 0) {
    close(this->listeningSocketData);
  }
  if (this->listeningSocketMetaData >= 0) {
    close(this->listeningSocketMetaData);
  }
  if (this->listeningSocketOutputData >= 0) {
    close(this->listeningSocketOutputData);
  }
  this->listeningSocketData = - 1;
  this->listeningSocketMetaData = - 1;
  this->listeningSocketOutputData = - 1;
}

bool Server::initialize() {
  if (this->flagInitialized) {
    return true;
  }
  logServer << "Creating GPU ..." << Logger::endL;
  this->theGPU = std::make_shared<GPU>();
  logServer << "GPU created, initializing kernels..." << Logger::endL;
  this->theGPU->initializeKernelsNoBuild();
  logServer << "Kernels initialized, initializing ports..." << Logger::endL;
  if (!this->initializePorts()) {
    return false;
  }
  logServer << "Server ports opened ..." << Logger::endL;
  if (!this->listenAll()) {
    return false;
  }
  if (!this->acceptAll()) {
    return false;
  }
  logServer << "All connections accepted." << Logger::endL;
  return true;
}

bool Server::Run() {
  if (!this->initialize()) {
    return false;
  }
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
        outputSocket = - 1;
        logServer << "Error: bind failed at port: " << portsToTry[i] << ". " << strerror(errno) << Logger::endL;
        continue;
      }
      return true;
    }
  }
  return false;
}

bool Server::initializePorts() {
  if (!this->initializeOneSocketAndPort(this->listeningSocketMetaData, this->portMetaData, portsToTryMetaData)) {
    return false;
  }
  if (!this->initializeOneSocketAndPort(this->listeningSocketData, this->portData, portsToTryData)) {
    return false;
  }
  if (!this->initializeOneSocketAndPort(this->listeningSocketOutputData, this->portOutputData, portsToTryOutputData)) {
    return false;
  }
  return true;
}

bool Server::acceptAll() {
  if (!this->acceptOneSocket(this->listeningSocketMetaData, this->thePipe.inputMeta->fileDescriptor, this->portMetaData)) {
    return false;
  }
  if (!this->acceptOneSocket(this->listeningSocketData, this->thePipe.inputData->fileDescriptor, this->portData)) {
    return false;
  }
  if (!this->acceptOneSocket(this->listeningSocketOutputData, this->thePipe.fileDescriptorOutputData, this->portOutputData)) {
    return false;
  }
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
  if (success != 0) {
    logServer << "Failed listening. " << strerror(errno);
    return false;
  }
  return true;
}

bool Server::listenAll() {
  if (!this->listenOneSocket(this->listeningSocketMetaData, this->thePipe.inputMeta->fileDescriptor, this->portMetaData)) {
    return false;
  }
  if (!this->listenOneSocket(this->listeningSocketData, this->thePipe.inputMeta->fileDescriptor, this->portData)) {
    return false;
  }
  if (!this->listenOneSocket(this->listeningSocketOutputData, this->thePipe.fileDescriptorOutputData, this->portOutputData)) {
    return false;
  }
  return true;
}

std::string MessageFromNode::toString() {
  std::stringstream out;
  out << "Message " << this->id << ": "
  << "command: " << this->command
  << ", length: " << this->length
  << ", content: ";
  if (this->theMessage == "") {
    out << "[empty]";
  } else {
    out << Miscellaneous::toStringShorten(this->theMessage, 50);
  }
  return out.str();
}

void MessageFromNode::reset() {
  this->id = "";
  this->length = - 1;
  this->command = "";
  this->theMessage = "";
}

/* Attempts to read up to this->capacity bytes from a given pipe. Will
 * fall asleep without timeout if no bytes are available.
 * Returns false on any kind of failure, true otherwise.
 */
bool PipeBasic::ReadMore() {
  if (this->position < this->length) {
    return true;
  }
  this->position = 0;
  this->length = 0;
  this->length = read(this->fileDescriptor, &this->buffer[0], this->buffer.size());
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

std::string PipeBasic::toString() {
  std::stringstream out;
  out << "Pipe: " << this->name << ", position: " << this->position << ", length: " << this->length << "\n";
  std::string bufferShortened(&this->buffer[0], this->length);
  out << "Content:[" << Logger::colorBlue << Miscellaneous::toStringShorten(bufferShortened, 60) << Logger::colorNormal << "]";

  return out.str();
}

std::string MessagePipeline::toStringPendingMessages() {
  std::stringstream out;
  out << "Completed messages: " << this->messagesRead.size() << "\n";
  out << "Incomplete messages: " << this->messagesWithMetadataButNoData.size() << "\n";
  for (unsigned i = 0; i < this->messagesWithMetadataButNoData.size(); i ++) {
    out << "Message " << i << ": " << this->messagesWithMetadataButNoData[i].toString();
  }
  out << "Currently read metadata: " << this->currentMetaDatA << "\n";
  out << "Meta buffer: " << this->inputMeta->toString() << "\n";
  out << "Data buffer: " << this->inputData->toString() << "\n";
  return out.str();
}

/* Reads available meta data, blocking if
 * no metadata is available.
 *
 * In what follows, we will say that a message is a
 * "wannabe" if it has complete metadata but no data.
 * A wannabe message may have its metadata incomplete;
 * in that case we refer to it as an incomplete wannabe message.
 *
 * More precisely, the function does the following.
 *
 * 1. If there are completed messages already read,
 *    returns immediately. Since this function can block,
 *    we cannot proceed if there are already completed messages, as
 *    blocking here would leave those unprocessed messages hanging.
 *
 * 2. If there are zero pending wannabe messages,
 *    adds an empty incomplete wannabe message
 *    to the pending message queue,
 *    raising the number of wannabe messages to one.
 *
 * 3. If there are two or more pending wannabe messages,
 *    returns immediately: the first of those is
 *    guaranteed to be a complete wannabe message
 *    (i.e., has all its metadata), so we should be looking for
 *    actual data.
 *
 * 4. If there is exactly one pending wannabe message,
 *    which must necessarily be incomplete,
 *    reads in a potentially blocking way from the metadata pipe.
 *
 *    The incomplete wannabe message
 *    we are processing here must have come
 *    either from Step 2 or from an empty or
 *    half-way read metadata from a
 *    previous run of this function.
 *
 * 5. Processes all bytes read from the metadata pipe.
 *    This creates a number of wannabe messages, all of which have
 *    complete metadata except potentially the last of them. The last
 *    wannabe message may end up being incomplete, if, for example,
 *    the metadata pipe ran out of capacity midway
 *    through transmitting the metadata of a single message.
 *    In practice, this is expected to happen extremely rarely.
 *    In fact, under normal work loads, this should not happen at all as the
 *    metadata pipe's capacity should never be approached.
 *
 */

bool MessagePipeline::ReadAvailableMetaData() {
  if (this->messagesRead.size() > 0) {
    //The present function is potentially blocking.
    //Therefore, if there are non-processed completely read messages,
    //we must not proceed as
    //that may leave those non-processed completely read
    //messages hanging.
    return true;
  }

  if (this->messagesWithMetadataButNoData.size() == 0) {
    this->messagesWithMetadataButNoData.push_back(MessageFromNode());
  }
  if (this->messagesWithMetadataButNoData.size() > 1) {
    //We have complete metadata for at least one message,
    //therefore we should proceed to fetch its data.
    //The last wannabe message
    //- in the worst case scenario the second one -
    //has incomplete metadata.
    return true;
  }
  //The following function is blocking - falls asleep if
  //no data is available.
  if (!this->inputMeta->ReadMore()) {
    return false;
  }
  //In the following loop, we convert all pending bytes into
  //"wannabe" messages - messages with metadata but no data.
  //If we get complete metadata for all pending messages,
  //we append one last incomplete wannabe message with empty metadata.
  //This while loop should exit with two or more wannabe messages in the
  //this->messagesWithMetadataButNoData queue. All except the last of them
  //must have complete metadata; the last must have incomplete metadata.
  while (this->inputMeta->position < this->inputMeta->length) {
    char currentChar = this->inputMeta->GetChar(); // <- increments this->inputMeta->position
    if (currentChar != '\n') {
      this->currentMetaDatA.push_back(currentChar);
      continue;
    }
    MessageFromNode& currentMessage = this->messagesWithMetadataButNoData.back();
    if (currentMessage.length < 0) {
      std::stringstream lengthReader(this->currentMetaDatA);
      lengthReader >> currentMessage.length;
      if (currentMessage.length <= 0) {
        logServer << "Failed to read current message length, got: "
        << currentMessage.length << ". " << Logger::endL;
        return false;
      }
      this->currentMetaDatA = "";
      continue;
    }
    if (currentMessage.command == "") {
      currentMessage.command = this->currentMetaDatA;
      this->currentMetaDatA = "";
      continue;
    }
    if (currentMessage.id == "") {
      currentMessage.id = this->currentMetaDatA;
      this->messagesWithMetadataButNoData.push_back(MessageFromNode());
      this->currentMetaDatA = "";
      continue;
    }
  }
  if (this->messagesWithMetadataButNoData.size() < 2) {
    logServer << "Fatal error: failed to read complete metadata. "
    << this->toStringPendingMessages()
    << Logger::endL;
    return false;
  }
  return true;
}

/* Reads available data, blocking if
 * none is available.
 *
 * We recall that a message is a "wannabe"
 * if it has metadata but no data. A wannabe message
 * is incomplete if its metadata is not complete.
 *
 * 1. If there are completed messages already read,
 *    returns immediately. Since this function can block,
 *    we cannot proceed if there are already completed messages, as
 *    blocking here would leave those unprocessed messages hanging.
 *
 * 2. If the wannabe messages are less than 2,
 *    generate an error: the last wannabe message is guaranteed
 *    to be incomplete, hence we don't have enough metadata
 *    to start reading data.
 *
 *    Step 2 should never be triggered.
 *
 * 3.
 *
 *
 */

bool MessagePipeline::ReadAvailableData() {
  if (this->messagesRead.size() > 0) {
    return true;
  }
  if (this->messagesWithMetadataButNoData.size() < 2) {
    logServer << "Fatal error: not enough metadata to start reading data. " << Logger::endL;
    return false;
  }

  //The following loop reads data.
  //Our strategy is to make a single read of all available bytes,
  //up to the pipe's capacity.
  //The bytes are then used to construct as many complete
  //messages as possible. Under normal circumstances,
  //the loop is
  //expected to execute only once, as the first run of the loop
  //would be expected to generate a complete message
  //(possibly many messages if they are small).
  //However, this may fail to be the case if we have a message that
  //exceeds the data pipe's capacity (should happen extremely rarely).
  //In that case, the loop will run until the point it is able to
  //construct at least one complete message.
  //
  //Since our data buffer is pretty large (some 50MB at the time of writing),
  //we cannot afford that many runs of this loop before we run out of RAM memory.
  //We should plan an appropriate error handling if that RAM memory boundary is approached.
  //Since normal messages are expected to be in the byte/kilobyte range,
  //the RAM memory bounds should never be approached under normal circumstances,
  //even if we have system overload.
  //
  //However, we can expect to approach RAM memory bounds as
  //a result of a malicious attack that has bypassed networking protections.
  //
  while (this->messagesRead.size() == 0) {
    //The following is a potentially blocking read.
    if (!this->inputData->ReadMore()) {
      return false;
    }
    for (this->inputData->position = 0; this->inputData->position < this->inputData->length; ) {
      MessageFromNode& currentMessage = this->messagesWithMetadataButNoData.front();
      int lengthNeeded = currentMessage.length - currentMessage.theMessage.size();
      if (this->inputData->position + lengthNeeded <= this->inputData->length) {
        currentMessage.theMessage.append(&this->inputData->buffer[this->inputData->position], lengthNeeded);
        this->inputData->position += lengthNeeded;
        //currentMessage now contains a completed message. We are moving it from the wannabe queue to the completed queue.
        this->messagesRead.push_back(std::move(this->messagesWithMetadataButNoData.front()));
        this->messagesWithMetadataButNoData.pop_front();
      } else {
        int numBytesThatCanBeRead = this->inputData->length - this->inputData->position;
        currentMessage.theMessage.append(& this->inputData->buffer[this->inputData->position], numBytesThatCanBeRead);
        this->inputData->position += numBytesThatCanBeRead;
      }
    }
  }
  return true;
}

/* Reads one lump of data available in the command and data pipes.
 * If no data is available, falls asleep.
 * When available, will read a large lump of data, containing possibly
 * more than one message from Node. The amount of data read is a function
 * of the pipe capacities:
 *
 * inputData.capacity
 *
 * and
 *
 * metaData.capacity.
 */

bool MessagePipeline::ReadAvailable() {
  if (!this->ReadAvailableMetaData()) {
    return false;
  }
  if (!this->ReadAvailableData()) {
    return false;
  }
  return true;
}

bool MessagePipeline::ReadNext() {
  if (!this->messagesRead.empty()) {
    return true;
  }
  if (!this->ReadAvailable()) {
    return false;
  }
  return true;
}

bool Server::RunOnce() {
  if (!this->thePipe.ReadNext()) { //reads all pending messages
    return false;
  }
  int numQueued = 0;
  this->packetNumberOfComputations = 0;
  while (!this->thePipe.messagesRead.empty()) {
    if (!this->QueueCommand(this->thePipe.messagesRead.front())) {
      return false;
    }
    numQueued ++;
    this->packetNumberOfComputations ++;
    this->thePipe.messagesRead.pop_front();
  }
  return true;
}

bool Server::QueueCommand(MessageFromNode& theMessage) {
  logServer << "Processing message: " << theMessage.toString() << Logger::endL;
  if (theMessage.command == "SHA256") {
    return this->QueueSha256(theMessage);
  }
  if (theMessage.command == "signOneMessage") {
    return this->QueueSignOneMessage(theMessage);
  }
  if (theMessage.command == "testBuffer") {
    return this->QueueTestBuffer(theMessage);
  }
  logServer << "Fatal error: unknown command. Message: " << theMessage.id << ", " << "command: " << theMessage.command
  << ", " << theMessage.length << " bytes. ";
  if (theMessage.length < 50) {
    logServer << "Message: " << theMessage.theMessage;
  }
  logServer << Logger::endL;
  return false;

}

bool Server::ExecuteQueued() {
  std::shared_ptr<GPUKernel> theKernelSha256     = this->theGPU->theKernels[GPU::kernelSHA256];
  std::shared_ptr<GPUKernel> theKernelSignOne    = this->theGPU->theKernels[GPU::kernelSign];
  std::shared_ptr<GPUKernel> theKernelTestBuffer = this->theGPU->theKernels[GPU::kernelTestBuffer];
  if (theKernelSha256->computationIds.size() > 0) {
    if (!this->ExecuteSha256s()) {
      return false;
    }
  }
  if (theKernelSignOne->computationIds.size() > 0) {
    if (!this->ExecuteSignMessages()) {
      return false;
    }
  }
  if (theKernelTestBuffer->computationIds.size() > 0) {
    if (!this->ExecuteTestBuffers()) {
      return false;
    }
  }
  return this->ProcessResults();
}

bool Server::QueueTestBuffer(MessageFromNode& theMessage) {

}

bool Server::QueueSha256(MessageFromNode& theMessage) {
  std::shared_ptr<GPUKernel> theKernel = this->theGPU->theKernels[GPU::kernelSHA256];
  std::vector<unsigned char>& offsets = theKernel->inputs[0]->buffer;
  std::vector<unsigned char>& lengths = theKernel->inputs[1]->buffer;
  std::vector<unsigned char>& messages = theKernel->inputs[3]->buffer;
  if (messages.size() + theMessage.theMessage.size() > messages.capacity()) {
    return false;
  }
  int oldLengthsSize = lengths.size();
  lengths.resize(oldLengthsSize + 4);
  memoryPool_write_uint(theMessage.theMessage.size(), &lengths[oldLengthsSize]);
  int oldOffsetSize = offsets.size();
  offsets.resize(oldOffsetSize + 4);
  memoryPool_write_uint(messages.size(), &offsets[oldLengthsSize]);
  messages.insert(messages.end(), theMessage.theMessage.begin(), theMessage.theMessage.end());
  theKernel->computationIds.push_back(theMessage.id);
  return true;
}

bool Server::ExecuteSha256s() {
  std::shared_ptr<GPUKernel> kernelSHA256 = this->theGPU->theKernels[GPU::kernelSHA256];
  kernelSHA256->writeToBuffer(1, kernelSHA256->inputs[0]->buffer);
  kernelSHA256->writeToBuffer(2, kernelSHA256->inputs[1]->buffer);
  kernelSHA256->writeToBuffer(4, kernelSHA256->inputs[3]->buffer);
  for (unsigned i = 0; i < kernelSHA256->computationIds.size(); i ++) {
    kernelSHA256->writeArgument(3, i);
    cl_int ret = clEnqueueNDRangeKernel(
      this->theGPU->commandQueue, kernelSHA256->kernel, 1, NULL,
      &kernelSHA256->global_item_size, &kernelSHA256->local_item_size, 0, NULL, NULL
    );
    if (ret != CL_SUCCESS) {
      logServer << "Failed to enqueue kernel. Return code: " << ret << ". ";
      return false;
    }
  }
  kernelSHA256->inputs[0]->buffer.resize(0);
  kernelSHA256->inputs[1]->buffer.resize(0);
  kernelSHA256->inputs[3]->buffer.resize(0);
  return true;
}

bool Server::ProcessResultsSha256(std::stringstream& output) {
  std::shared_ptr<GPUKernel> kernelSHA256 = this->theGPU->theKernels[this->theGPU->kernelSHA256];
  cl_mem& result = kernelSHA256->outputs[0]->theMemory;
  cl_int ret = clEnqueueReadBuffer(
    this->theGPU->commandQueue,
    result,
    CL_TRUE,
    0,
    kernelSHA256->computationIds.size() * 32,
    this->thePipe.bufferOutputGPU,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logServer << "Failed to read buffer. " << Logger::endL;
    return false;
  }
  for (unsigned i = 0; i < kernelSHA256->computationIds.size(); i ++) {
    std::string outputBinary((char*)  &this->thePipe.bufferOutputGPU[i * 32], 32);
    output << "{\"id\":\"" << kernelSHA256->computationIds[i] << "\", \"result\": \"" << Miscellaneous::toStringHex(outputBinary)
    << "\", \"packetSize:\"" << this->packetNumberOfComputations << "}\n";
    logServer << "Computation " << kernelSHA256->computationIds[i] << " completed." << Logger::endL;

  }
  return true;
}

bool Server::QueueSignOneMessage(MessageFromNode& theMessage) {
  if (theMessage.length != 32 * 3) {
    logServer << "Sign one message: got message of length: " << theMessage.length
    << ", expected " << 32 * 3 << " bytes." << Logger::endL;
    return false;
  }
  logServer << "Got 96 bytes, as expected: " << Miscellaneous::toStringHex(theMessage.theMessage) << Logger::endL;
  std::shared_ptr<GPUKernel> kernelSign = this->theGPU->theKernels[GPU::kernelSign];

  std::vector<unsigned char>& outputSignatures = kernelSign->outputs[0]->buffer;
  std::vector<unsigned char>& nonces = kernelSign->outputs[2]->buffer;
  std::vector<unsigned char>& secretKeys = kernelSign->inputs[0]->buffer;
  std::vector<unsigned char>& messages = kernelSign->inputs[1]->buffer;
  if (
    messages.size()   + 32 > messages.capacity() ||
    secretKeys.size() + 32 > secretKeys.capacity() ||
    nonces.size()     + 32 > nonces.capacity() ||
    (kernelSign->computationIds.size() + 1) * (MACRO_size_of_signature) > outputSignatures.capacity()
  ) {
    return false;
  }
  std::string theNonce         = theMessage.theMessage.substr(0,  32);
  std::string theSecretKey     = theMessage.theMessage.substr(32, 32);
  std::string theMessageToSign = theMessage.theMessage.substr(64, 32);
  nonces.insert(nonces.end(), theNonce.begin(), theNonce.end());
  secretKeys.insert(secretKeys.end(), theSecretKey.begin(), theSecretKey.end());
  messages.insert(messages.end(), theMessageToSign.begin(), theMessageToSign.end());
  kernelSign->computationIds.push_back(theMessage.id);
  this->packetNumberOfComputations ++;
  return true;
}

bool Server::ExecuteTestBuffers() {/*
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
  }*/
  return false;
}

bool Server::ExecuteSignMessages() {
  std::shared_ptr<GPUKernel> kernelSign = this->theGPU->theKernels[this->theGPU->kernelSign];
  CryptoEC256k1GPU::initializeGeneratorContext(*this->theGPU.get());

  kernelSign->writeToBuffer(2, kernelSign->outputs[2]->buffer);
  kernelSign->writeToBuffer(3, kernelSign->inputs[0]->buffer);
  kernelSign->writeToBuffer(4, kernelSign->inputs[1]->buffer);
  for (unsigned i = 0; i < kernelSign->computationIds.size(); i ++) {
    kernelSign->writeArgument(6, i);
    cl_int ret = clEnqueueNDRangeKernel(
      this->theGPU->commandQueue, kernelSign->kernel, 1, NULL,
      &kernelSign->global_item_size, &kernelSign->local_item_size, 0, NULL, NULL
    );
    if (ret != CL_SUCCESS) {
      logServer << "Failed to enqueue kernel. Return code: " << ret << ". ";
      return false;
    }
  }
  kernelSign->outputs[2]->buffer.resize(0);
  kernelSign->inputs[0]->buffer.resize(0);
  kernelSign->inputs[1]->buffer.resize(0);
  return true;
}

bool Server::ProcessResultSignMessages(std::stringstream &output) {
  std::shared_ptr<GPUKernel> kernelSign = this->theGPU->theKernels[this->theGPU->kernelSign];
  cl_mem& resultSignatures = kernelSign->outputs[0]->theMemory;
  cl_int ret = clEnqueueReadBuffer(
    this->theGPU->commandQueue,
    resultSignatures,
    CL_TRUE,
    0,
    kernelSign->computationIds.size() * MACRO_MEMORY_POOL_SIZE_Signature,
    this->thePipe.bufferOutputGPU,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logServer << "Failed to read buffer. " << Logger::endL;
    return false;
  }
  cl_mem& resultSignatureSizes = kernelSign->outputs[1]->theMemory;
  ret = clEnqueueReadBuffer(
    this->theGPU->commandQueue,
    resultSignatureSizes,
    CL_TRUE,
    0,
    kernelSign->computationIds.size() * 4,
    this->thePipe.bufferOutputGPU_second,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logServer << "Failed to read buffer. " << Logger::endL;
    return false;
  }

  for (unsigned i = 0; i < kernelSign->computationIds.size(); i ++) {
    unsigned currentSize = memoryPool_read_uint(&this->thePipe.bufferOutputGPU_second[i * 4]);
    std::string outputBinary((char*) &this->thePipe.bufferOutputGPU[i * MACRO_MEMORY_POOL_SIZE_Signature], currentSize);
    output << "{\"id\":\"" << kernelSign->computationIds[i] << "\", \"result\": \"" << Miscellaneous::toStringHex(outputBinary)
    << "\", \"packetSize:\"" << this->packetNumberOfComputations << "}\n";
    logServer << "Computation " << kernelSign->computationIds[i] << " completed." << Logger::endL;
  }
  return true;
}

bool Server::WriteResults(std::stringstream& output) {
  logServer << "Writing computation packet ..." << Logger::endL;
  int numWrittenBytes = write(this->thePipe.fileDescriptorOutputData, output.str().c_str(), output.str().size());
  logServer << "Computation output written." << Logger::endL;
  if (numWrittenBytes < 0) {
    logServer << "Error writing bytes. " << Logger::endL;
    return false;
  }
  if (numWrittenBytes < (signed) output.str().size()) {
    logServer << "Did not manage to write all bytes. " << Logger::endL;
    return false;
  }
  return true;
}



bool Server::ProcessResults() {
  std::stringstream output;
  if (!this->ProcessResultsSha256(output)) {
    return false;
  }
  if (!this->ProcessResultSignMessages(output)) {
    return false;
  }
  //if (!this->ProcessResultsTestBuffer(output)){
  //  return false;
  //}
  return this->WriteResults(output);
}
