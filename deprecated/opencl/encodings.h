#ifndef ENCODINGS_header
#define ENCODINGS_header
#include <string>

class Encodings {
public:
  static std::string getStringFromPercentEncodedString(const std::string& inputPercentEncoded, bool replacePlusBySpace);
  static std::string getPercentEncodedStringFromString(const std::string& input, bool usePlusesForSpacebars);
  static std::string getStringWithEscapedNewLinesQuotesBackslashes(const std::string& input);
  //use to generate json to be inserted in mongo db
  //(dots in keys have special treatment and need to be encoded).
  static std::string getPercentEncodedStringEncodeDots(const std::string& input, bool usePlusesForSpacebars);
  static char getCharValueFromHumanReadableHex(char input);
  static bool IsAHexDigit(char digitCandidate);
  static bool isALatinLetter(char input);
  static bool isADecimalDigit (char digitCandidate, int* whichDigit);
  static bool isRepresentedByItselfInURLs(char input);
  static bool getStringFromPercentEncodedStringOneStep(std::string& readAhead, std::stringstream& out, bool replacePlusBySpace);
};


#endif // ENCODINGS_header

