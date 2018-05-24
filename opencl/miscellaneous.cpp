#include "miscellaneous.h"
#include <sstream>
#include <iomanip>
#include <experimental/filesystem>

std::string Miscellaneous::toStringHex(const std::string& other) {
  std::stringstream out;
  for (unsigned i = 0; i < other.size(); i ++ )
    out << std::hex << std::setfill('0') << std::setw(2) << ((int) ((unsigned char) other[i]));
  return out.str();
}

std::string Miscellaneous::toStringShorten(const std::string& input, int numCharactersToRetain) {
  if (numCharactersToRetain <= 0)
    return input;
  int numCharsAtEnds = numCharactersToRetain / 2;
  int numCharsToSuppress = ((unsigned) input.size()) - numCharsAtEnds * 2;
  if (numCharsToSuppress <= 0 || (unsigned) numCharsAtEnds > input.size())
    return input;
  std::stringstream out;
  for (int i = 0; i < numCharsAtEnds; i ++)
    out << input[i];
  out << "...(" << numCharsToSuppress << " omitted)...";
  for (int i = 0; i < numCharsAtEnds; i ++)
    out << input[input.size() - numCharsAtEnds + i];
  return out.str();
}

StateMaintainerFolderLocation::StateMaintainerFolderLocation() {
  this->ambientDirectoryAtObjectCreation = std::experimental::filesystem::current_path();

}
