//The current file is licensed under the license terms found in the main header file "vpf.h".
//For additional information refer to the file "vpf.h".
#ifndef MACROJson_h_already_included
#define MACROJson_h_already_included

#include <sstream>
#include <vector>
#include <unordered_map>
#include <memory>


/*The best kind of misleading documentation is aspirational
  JSData data;
  data["name"] = "JSLibrary";
  data["version"] = 3.14;
  data["types"][0] = "null";
  data["types"][1] = "boolean";
  data["types"][2] = "number";
  data.writefile("jslib");
  stOutput << data << "\n";
  JSData data2;
  data2.readfile("jslib");
  stOutput << data2 << "\n";
*/

//enum JSType{null, boolean, number, string, list, hash};
// error: 'JSData::number' cannot appear in a constant-expression
// or
// error: 'JSType' is not a cass or namespace

//struct JSHashData;

class JSData
{
public:
  static const int numEmptyTokensAtStart = 6;
  static const char JSUndefined    = 0;
  static const char JSnull         = 1;
  static const char JSbool         = 2;
  static const char JSnumber       = 3;
  static const char JSstring       = 4;
  static const char JSarray        = 5;
  static const char JSObject       = 6;
  static const char JSopenBrace    = 7;
  static const char JScloseBrace   = 8;
  static const char JSopenBracket  = 9;
  static const char JScloseBracket = 10;
  static const char JScolon        = 11;
  static const char JScomma        = 12;
  static const char JSerror        = 13;

  char type;
  bool boolean;
  double number;
  std::string string;
  std::vector<JSData> list;
  std::unordered_map<std::string, std::shared_ptr<JSData> > objects;
  void operator=(const bool other);
  void operator=(int other);
  void operator=(const double other);
  void operator=(const std::string& other);
  void operator=(const char* other);
  JSData& operator[](int i);
  JSData& operator[](const std::string& s);
  JSData GetValueCopy(const std::string& key);
  bool HasKey(const std::string& key);
  void SetKeyValue(const std::string& key, const JSData& value);
  std::shared_ptr<JSData> copyMe();
  JSData() {
    this->reset();
  }
  JSData(const JSData& other){
    this->operator=(other);
  }
  JSData(const char* other)
  { this->reset();
    this->operator =(other);
  }
  JSData(char other)
  { this->reset(other);
  }
  void operator=(const JSData& other)
  { this->type = other.type;
    this->boolean = other.boolean;
    this->number = other.number;
    this->string = other.string;
    this->list = other.list;
    this->objects = other.objects;
  }
  void operator=(const std::vector<JSData>& other);
  // there has to be a better way to do this
  void operator=(const int& other);
  void operator=(const std::vector<int>& other);
  bool isTrueRepresentationInJSON();
  // parsing
  void ExtractScalar(const std::string& json, int begin, int end);
  bool IsValidElement();
  void reset(char inputType = JSData::JSUndefined);
  std::string toString(bool percentEncodeKeysIncludingDots, bool useHTML = false) const;
  template <typename somestream>
  somestream& IntoStream(somestream& out, bool percentEncodeStrings, int indentation = 0, bool useHTML = false) const;
  void readfile(const char* filename);
  bool readstring(const std::string& json, bool stringsWerePercentEncoded, std::stringstream* commentsOnFailure = 0);
  void TryToComputeType();
  static bool Tokenize(const std::string& input, std::vector<JSData> &output);
  void writefile(const char* filename) const;
  static void FilterColumnsJSDataObjectList(std::vector<JSData>& inputOutput, const std::vector<std::string>& columnsToPreserve);
};

std::ostream& operator<<(std::ostream& out, const JSData& data);

#endif
