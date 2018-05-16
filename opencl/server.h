#ifndef SERVER_H_header
#define SERVER_H_header
#include <memory>
#include <queue>
#include "gpu.h"

class MessageFromNode {
public:
  std::string theMessage;
  int length;
  std::string id;
  std::string command;
  void reset();
  MessageFromNode() {
    this->reset();
  }
};

class PipeBasic {
public:
  int position;
  int length;
  int capacity;
  char* buffer;
  int fileDescriptor;
  std::string name;
  char GetChar();
  bool ReadMore();
  PipeBasic(int inputCapacity, const std::string& inputName);
  ~PipeBasic();
};

class MessagePipeline {
  bool ReadOne();
public:
  int fileDescriptorOutputData;

  int bufferCapacityData; //Size of main message pipe
  int bufferCapacityMetaData; //Size of metadata pipe

  std::queue<MessageFromNode> messageQueue;

  MessageFromNode currentMessage;

  PipeBasic* inputData;
  PipeBasic* inputMeta;
  char* bufferOutputGPU;
  bool ReadNext();
  MessagePipeline();
  ~MessagePipeline();
};

class Server
{
public:
  std::shared_ptr<GPU> theGPU;
  bool flagInitialized;
  int listeningSocketMetaData;
  int listeningSocketData;
  int listeningSocketOutputData;

  MessagePipeline thePipe;


  std::string portMetaData;
  std::string portData;
  std::string portOutputData;
  std::string queueMetaData;
  Server();
  ~Server();
  bool Run();
  bool RunOnce();
  bool ExecuteNodeCommand(MessageFromNode& theMessage);
  bool ExecuteSha256(MessageFromNode& theMessage);
  bool ExecuteTestBuffer(MessageFromNode& theMessage);
  bool initialize();
  bool initializePorts();
  bool initializeOneSocketAndPort(int& outputSocket, std::string& outputPort, std::vector<std::string>& portsToTry);
  bool listenAll();
  bool listenOneSocket(int theSocket, int& outputFileDescriptor, const std::string& outputPort);
  bool acceptAll();
  bool acceptOneSocket(int theSocket, int& outputFileDescriptor, const std::string& outputPort);
};

#endif // SERVER_H_header

