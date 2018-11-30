#include "encodings.h"
#include <sstream>

char Encodings::getCharValueFromHumanReadableHex(char input){
  switch (input){
    case '0': return 0;
    case '1': return 1;
    case '2': return 2;
    case '3': return 3;
    case '4': return 4;
    case '5': return 5;
    case '6': return 6;
    case '7': return 7;
    case '8': return 8;
    case '9': return 9;
    case 'A': return 10;
    case 'a': return 10;
    case 'B': return 11;
    case 'b': return 11;
    case 'C': return 12;
    case 'c': return 12;
    case 'D': return 13;
    case 'd': return 13;
    case 'E': return 14;
    case 'e': return 14;
    case 'F': return 15;
    case 'f': return 15;
    default:
      return - 1;
  }
}

bool Encodings::isADecimalDigit(char digitCandidate, int* whichDigit){
  char theDigit = digitCandidate - '0';
  bool result = (theDigit < 10 && theDigit >= 0);
  if (result && whichDigit != 0) {
    *whichDigit = theDigit;
  }
  return result;
}

bool Encodings::IsAHexDigit(char digitCandidate) {
  if (Encodings::isADecimalDigit(digitCandidate, 0)) {
    return true;
  }
  if (digitCandidate >= 'A' && digitCandidate <= 'F')
    return true;
  if (digitCandidate >= 'a' && digitCandidate <= 'f')
    return true;
  return false;
}

bool Encodings::getStringFromPercentEncodedStringOneStep(std::string& readAhead, std::stringstream& out, bool replacePlusBySpace)
{ if (replacePlusBySpace)
    if (readAhead[0] == '+')
      { out << " ";
        return true;
      }
  bool isOK = readAhead[0] != '%' && readAhead[0] != '&';
  if (isOK)
  { out << readAhead[0];
    return true;
  }
  if (readAhead == "&")
  { out << " ";
    return true;
  }
  if (readAhead.size() == 3)
    if (readAhead[0] == '%' && Encodings::IsAHexDigit(readAhead[1]) && Encodings::IsAHexDigit(readAhead[2]))
    { out << (char)(Encodings::getCharValueFromHumanReadableHex(readAhead[1]) * 16 +
      Encodings::getCharValueFromHumanReadableHex(readAhead[2]));
      return true;
    }
  return false;
}

bool Encodings::isALatinLetter(char input)
{ if (input >= 'a' && input <= 'z')
    return true;
  if (input >= 'A' && input <= 'Z')
    return true;
  return false;
}


bool Encodings::isRepresentedByItselfInURLs(char input)
{ if (Encodings::isADecimalDigit(input, 0))
    return true;
  if (Encodings::isALatinLetter(input))
    return true;
  return input == '.';
}

std::string Encodings::getPercentEncodedStringEncodeDots(const std::string& input, bool usePlusesForSpacebars) {
  std::stringstream out;
  for (unsigned int i = 0; i < input.size(); i ++) {
    if (Encodings::isRepresentedByItselfInURLs(input[i]) && input[i] != '.') {
      out << input[i];
    } else if (input[i] == ' ' && usePlusesForSpacebars) {
      out << '+';
    } else {
      out << "%";
      int x = (char) input[i];
      out << std::hex << ((x / 16) % 16) << (x % 16) << std::dec;
    }
  }
  return out.str();
}


std::string Encodings::getPercentEncodedStringFromString(const std::string& input, bool usePlusesForSpacebars)
{ std::stringstream out;
  for (unsigned int i = 0; i < input.size(); i ++)
    if (Encodings::isRepresentedByItselfInURLs(input[i]))
      out << input[i];
    else if (input[i] == ' ' && usePlusesForSpacebars)
      out << '+';
    else
    { out << "%";
      int x = (char) input[i];
      out << std::hex << ((x / 16) % 16) << (x % 16) << std::dec;
    }
  return out.str();
}

std::string Encodings::getStringFromPercentEncodedString(const std::string& inputPercentEncoded, bool replacePlusBySpace) {
  std::string readAhead;
  std::stringstream out;
  int inputSize = (signed) inputPercentEncoded.size();
  for (int i = 0; i < inputSize; i ++) {
    readAhead = "";
    for (int j = 0; j < 6; j ++){
      if (i + j < inputSize) {
        readAhead.push_back(inputPercentEncoded[i + j]);
      }
      if (getStringFromPercentEncodedStringOneStep(readAhead, out, replacePlusBySpace)){
        i += j;
        break;
      }
    }
  }
  return out.str();
}
