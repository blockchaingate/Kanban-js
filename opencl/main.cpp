#include <sstream>
#include <iostream>
#include <assert.h>

const int bufferSize = 100;
char inputBuffer[bufferSize];
char inputBufferMetaData[10];
int totalCouts = 0;
int main(void)
{
  std::string inputString, inputMeta;
  int lastInputSize = 0;
  int messageId = -1;
  while (true)
  { //lastInputSize =
    std::cin.getline(inputBufferMetaData, 10);
    inputMeta.assign(inputBufferMetaData);
    lastInputSize = std::stoi(inputMeta);
    std::cin.getline(inputBufferMetaData, 10);
    inputMeta.assign(inputBufferMetaData);
    messageId = std::stoi(inputMeta);
    if (lastInputSize > bufferSize - 60 || lastInputSize <= 0)
    { std::cout << ++ totalCouts << ": nodejs wants to send invalid number of bytes: " << lastInputSize << ". ";
      return - 1;
    }
    std::cin.read(inputBuffer, lastInputSize);
    if (lastInputSize != std::cin.gcount())
    { std::cout << ++ totalCouts << ": received " << std::cin.gcount() << " bytes, expected: " << lastInputSize;
      return - 1;
    }
    inputString.assign(inputBuffer, lastInputSize);
    std::cout << "{\"id\":" << messageId << ","
    << "\"message\": \"" << ++ totalCouts << ": bouncing back: " << inputString << "\"}" << std::endl;
  }
  return 0;
}
