#ifndef SERVER_H_header
#define SERVER_H_header
#include <memory>
#include "gpu.h"

class Server
{
public:
  std::shared_ptr<GPU> theGPU;
  bool flagInitialized;
  int listeningSocketMetaData;
  int listeningSocketData;
  int listeningSocketOutputData;
  int fileDescriptorMetaData;
  int fileDescriptorData;
  int fileDescriptorOutputData;
  std::string currentMessageLengthString;
  int currentMessageLength;
  std::string portMetaData;
  std::string portData;
  std::string portOutputData;
  std::string currentMessageId;
  std::string queueMetaData;
  Server();
  ~Server();
  bool ReadOneSmallString(std::string& output);
  bool ReadNextMetaDataPiece(std::string& output);
  bool ReadNextMetaData();
  bool Run();
  bool RunOnce();
  bool initialize();
  bool initializePorts();
  bool initializeOneSocketAndPort(int& outputSocket, std::string& outputPort, std::vector<std::string>& portsToTry);
  bool listenAll();
  bool listenOneSocket(int theSocket, int& outputFileDescriptor, const std::string& outputPort);
  bool acceptAll();
  bool acceptOneSocket(int theSocket, int& outputFileDescriptor, const std::string& outputPort);
};

#endif // SERVER_H_header

