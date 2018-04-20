#include <sstream>
#include <iostream>
#include <assert.h>
#include <iomanip>

const int bufferSize = 10000000;
char inputBuffer[bufferSize];
char inputBufferMetaData[10];
int totalCouts = 0;

std::string getHex(const std::string& other)
{
  std::stringstream out;
  for (unsigned i = 0; i < other.size(); i ++ )
    out << std::hex << std::setfill('0') << std::setw(2) << ((int) ((unsigned char) other[i]));
  return out.str();
}

int main(void)
{
  std::string inputString, inputMeta;
  int lastInputSize = 0;
  int messageId = -1;
  int runId = -1;
  while (true)
  { //lastInputSize =
    runId ++;
    try
    {
      std::cin.getline(inputBufferMetaData, 10);
      inputMeta.assign(inputBufferMetaData);
      std::cerr << "Run id: " << runId << "\n";
      std::cerr << "size input: " << inputMeta << "\n";
      lastInputSize = std::stoi(inputMeta);
      std::cin.getline(inputBufferMetaData, 10);
      inputMeta.assign(inputBufferMetaData);
      std::cerr << "id input: " << inputMeta << "\n";
      messageId = std::stoi(inputBufferMetaData);
    }
    catch (int e)
    { std::cerr << "Bad stoi with input: " << inputMeta;
      std::cout << "Bad stoi with input: " << inputMeta;
      return - 1;
    }
    if (lastInputSize > bufferSize - 60 || lastInputSize <= 0)
    {
      std::cout << ++ totalCouts << ": nodejs wants to send invalid number of bytes: " << lastInputSize << ". ";
      std::cout.flush();
      return - 1;
    }
    std::cin.read(inputBuffer, lastInputSize);
    if (lastInputSize != std::cin.gcount())
    {
      std::cout << ++ totalCouts << ": received " << std::cin.gcount() << " bytes, expected: " << lastInputSize;
      std::cout.flush();
      return - 1;
    }
    inputString.assign(inputBuffer, lastInputSize);
    if ((inputString.size() > 9000000))
    {
      std::cout << "Output too large (" << inputString.size() << " bytes).";
      std::cout.flush();
      return - 1;
    }
    std::cerr << "\nTellg: " << std::cin.tellg() << "\n";
    std::cout << "{\"id\":" << messageId << ","
    << "\"message\": \"" << ++ totalCouts << "; got " << inputString.size() << " bytes: " << getHex(inputString) << "\"}";
    std::cout.flush();
  }
  return 0;
}
