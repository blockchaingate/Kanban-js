#include "json.h"
#include "encodings.h"
#include <sys/stat.h>
#include <cassert>
#include <fstream>

std::shared_ptr<JSData> JSData::copyMe(){
  std::shared_ptr<JSData> result = std::make_shared<JSData>();
  *result = *this;
  return result;
}

void JSData::operator=(int other)
{ this->reset();
  this->type = this->JSnumber;
  this->number = other;
}

void JSData::operator=(const bool other)
{ this->reset();
  this->type = this->JSbool;
  this->boolean = other;
}

void JSData::operator=(const double other)
{ this->reset();
  this->type = this->JSnumber;
  this->number = other;
}

void JSData::operator=(const char* other)
{ std::string otherString(other);
  this->operator =(otherString);
}

void JSData::operator=(const std::string& other)
{ this->reset();
  this->type = this->JSstring;
  this->string = other;
}

JSData& JSData::operator[](int i){
  this->type = this->JSarray;
  if (this->list.size() < (unsigned)(i + 1)) {
    this->list.resize(i + 1);
  }
  return this->list[i];
}

JSData JSData::GetValueCopy(const std::string& key){
  if (this->objects.find(key) != this->objects.end()) {
    return *this->objects[key].get();
  }
  JSData result;
  result.type = JSData::JSUndefined;
  return result;
}

bool JSData::HasKey(const std::string& key){
  return this->objects.find(key) != this->objects.end();
}

void JSData::SetKeyValue(const std::string& key, const JSData& value){
  (*this)[key] = value;
}

JSData& JSData::operator[](const std::string& key){
  this->type = this->JSObject;
  if (this->objects.find(key) == this->objects.end())
  { std::shared_ptr<JSData> incoming = std::make_shared<JSData>();
    this->objects[key] = incoming;
  }
  return *this->objects[key].get();
}

void JSData::readfile(const char* filename){
  std::ifstream ifp(filename);
  if (!ifp.is_open())
    return;
  struct stat f;
  stat(filename, &f);
  std::string json;
  json.resize(f.st_size);
  ifp.read(&json[0], json.size());
  this->readstring(json, false);
}

void JSData::operator=(const std::vector<JSData>& other)
{ this->type = this->JSarray;
  this->list = other;
  this->objects.clear();
}

bool JSData::isTrueRepresentationInJSON()
{ if (this->type == JSData::JSbool)
    return this->boolean;
  if (this->type != JSData::JSstring)
    return false;
  return this->string == "true";
}

bool JSData::IsValidElement()
{ return
  this->type == this->JSnull   ||
  this->type == this->JSbool   ||
  this->type == this->JSnumber ||
  this->type == this->JSstring ||
  this->type == this->JSarray  ||
  this->type == this->JSObject;
}

void JSData::TryToComputeType()
{ if (this->type != this->JSUndefined)
    return;
  if (this->string == "")
    return;
  if (this->string == "null")
  { this->reset();
    this->type = this->JSnull;
    return;
  }
  if (this->string == "true")
  { this->reset();
    this->type = this->JSbool;
    this->boolean = true;
    return;
  }
  if (this->string == "false")
  { this->reset();
    this->type = this->JSbool;
    this->boolean = false;
    return;
  }
  int digitReader = 0;
  if (this->string.size() > 0)
    if (this->string[0] == '-' || Encodings::isADecimalDigit(this->string[0], &digitReader)) {
      this->number = digitReader;
      this->string = "";
      this->type = JSData::JSnumber;
      return;
    }
  this->type = JSData::JSstring;
}

bool JSData::Tokenize(const std::string& input, std::vector<JSData>& output){
  output.resize(0);
  output.reserve(input.size());
  JSData currentElt;
  bool inQuotes = false;
  bool previousIsBackSlash = false;
  for (unsigned i = 0; i < input.size(); i ++) {
    if (input[i] == '"') {
      if (currentElt.type == currentElt.JSstring) {
        if (previousIsBackSlash) {
          currentElt.string[currentElt.string.size() - 1] = '\"';
          previousIsBackSlash = false;
        } else {
          output.push_back(currentElt);
          currentElt.reset();
          inQuotes = false;
        }
      } else {
        currentElt.TryToComputeType();
        if (currentElt.type != currentElt.JSUndefined) {
          output.push_back(currentElt);
        }
        currentElt.reset();
        currentElt.type = currentElt.JSstring;
        inQuotes = true;
        previousIsBackSlash = false;
      }
      continue;
    }
    if (inQuotes && currentElt.type == currentElt.JSstring)
      if (input[i] == '\\')
      { if (previousIsBackSlash)
          previousIsBackSlash = false;
        else
        { previousIsBackSlash = true;
          currentElt.string += '\\';
        }
        continue;
      }
    previousIsBackSlash = false;
    if (inQuotes && currentElt.type == currentElt.JSstring) {
      currentElt.string += input[i];
      continue;
    }
    if (input[i] == ' ' || input[i] == '\r' || input[i] == '\n') {
      currentElt.TryToComputeType();
      if (currentElt.type != currentElt.JSUndefined) {
        output.push_back(currentElt);
        currentElt.reset();
      }
      continue;
    }
    if (input[i] == '{' || input[i] == '}' ||
        input[i] == '[' || input[i] == ']' ||
        input[i] == ':' || input[i] ==  ',') {
      currentElt.TryToComputeType();
      if (currentElt.type != JSData::JSUndefined) {
        output.push_back(currentElt);
      }
      currentElt.reset();
      if (input[i] == '{') {
        currentElt.type = currentElt.JSopenBrace;
      }
      if (input[i] == '[') {
        currentElt.type = currentElt.JSopenBracket;
      }
      if (input[i] == '}') {
        currentElt.type = currentElt.JScloseBrace;
      }
      if (input[i] == ']') {
        currentElt.type = currentElt.JScloseBracket;
      }
      if (input[i] == ':') {
        currentElt.type = currentElt.JScolon;
      }
      if (input[i] == ',') {
        currentElt.type = currentElt.JScomma;
      }
      output.push_back(currentElt);
      currentElt.reset();
      continue;
    }
    currentElt.string += input[i];
  }
  return true;
}

bool JSData::readstring
(const std::string& json, bool stringsWerePercentEncoded, std::stringstream* commentsOnFailure) {
  this->reset();
  std::vector<JSData> theTokenS;
  JSData::Tokenize(json, theTokenS);
  if (theTokenS.size() == 0)
    return false;
  if (stringsWerePercentEncoded)
    for (unsigned i = 0; i < theTokenS.size(); i ++)
      if (theTokenS[i].type == JSData::JSstring)
        theTokenS[i].string = Encodings::getStringFromPercentEncodedString(theTokenS[i].string, false);
  std::vector<JSData> readingStack;
  JSData emptyElt;
  for (unsigned i = 0; i < JSData::numEmptyTokensAtStart; i ++) {
    readingStack.push_back(emptyElt);
  }
  readingStack.push_back(theTokenS[0]);
  for (unsigned i = 0;;) {
    JSData& last = readingStack[(int) (readingStack.size() - 1)];
    JSData& secondToLast = readingStack[(int) (readingStack.size() - 2)];
    JSData& thirdToLast  = readingStack[(int) (readingStack.size() - 3)];
    JSData& fourthToLast = readingStack[(int) (readingStack.size() - 4)];
    //JSData& fifthToLast=theTokenS[i - 4];
    if (fourthToLast.type == JSData::JSopenBrace && thirdToLast.type  == JSData::JSstring &&
        secondToLast.type == JSData::JScolon && last.IsValidElement()) {
      fourthToLast.objects[thirdToLast.string] = last.copyMe();
      readingStack.resize(readingStack.size() - 3);
      continue;
    }
    if (secondToLast.type == JSData::JSopenBracket && last.IsValidElement()) {
      secondToLast.list.push_back(last);
      readingStack.pop_back();
      continue;
    }
    if (secondToLast.type == JSData::JSopenBracket && last.type == JSData::JScomma) {
      readingStack.pop_back();
      continue;
    }
    if ((secondToLast.type == JSData::JSopenBrace ||
         secondToLast.type == JSData::JSopenBracket) && last.type == JSData::JScomma) {
      readingStack.pop_back();
      continue;
    }
    if (secondToLast.type == JSData::JSopenBrace && last.type == JSData::JScloseBrace) {
      secondToLast.type = JSData::JSObject;
      readingStack.pop_back();
      continue;
    }
    if (secondToLast.type == JSData::JSopenBracket && last.type == JSData::JScloseBracket) {
      secondToLast.type = JSData::JSarray;
      readingStack.pop_back();
      continue;
    }
    i ++;
    if (i >= theTokenS.size())
      break;
    readingStack.push_back(theTokenS[i]);
  }
//  stOutput << "DEBUG: " << "go to here finally. ";
  if (readingStack.size() != JSData::numEmptyTokensAtStart + 1) {
    if (commentsOnFailure != 0) {
      *commentsOnFailure << "Failed to parse your json.\n";
      for (unsigned i = JSData::numEmptyTokensAtStart; i < readingStack.size(); i ++)
        *commentsOnFailure << i << ": " << readingStack[i].toString(false) << "\n<br>\n";
    }
    return false;
  }
  if (JSData::numEmptyTokensAtStart < readingStack.size()) {
    *this = readingStack[JSData::numEmptyTokensAtStart];
  }
  return true;
}

std::string Encodings::getStringWithEscapedNewLinesQuotesBackslashes(const std::string& input) {
  std::stringstream out;
  for (unsigned i = 0; i < input.size(); i ++)
    if (input[i] == '"')
      out << "\\\"";
    else if (input[i] == '\\')
      out << "\\\\";
    else if (input[i] == '\n')
      out << "\\n";
    else
      out << input[i];
  return out.str();
}

template <typename somestream>
somestream& JSData::IntoStream(somestream& out, bool percentEncodeStrings, int indentation, bool useHTML) const
{ //MacroRegisterFunctionWithName("JSData::IntoStream");
  std::string theIndentation = "";
  for (int i = 0; i < indentation; i ++)
  { if (!useHTML)
      theIndentation += "";
    else
      theIndentation += "&nbsp;";
  }
  out << theIndentation;
  std::string newLine = useHTML ? "\n<br>\n" : "";
  indentation ++;
  bool found = false;
  switch (this->type)
  { case JSnull:
      out << "null";
      return out;
    case JSnumber:
      out << this->number;
      return out;
    case JSbool:
      if (this->boolean == true)
        out << "true";
      else
        out << "false";
      return out;
    case JSstring:
      if (! percentEncodeStrings)
        out << '"' << Encodings::getStringWithEscapedNewLinesQuotesBackslashes(this->string) << '"';
      else
        out << '"' << Encodings::getPercentEncodedStringFromString(this->string, false) << '"';
      return out;
    case JSarray:
      out << "[" << newLine;
      for (unsigned i = 0; i < this->list.size(); i ++) {
        this->list[i].IntoStream(out, percentEncodeStrings, indentation, useHTML);
        if (i != this->list.size() - 1) {
          out << ", ";
        }
      }
      out << newLine << ']';
      return out;
    case JSObject:
      out << "{" << newLine;
      found = false;
      for (auto keyValuePair = this->objects.begin(); keyValuePair!= this->objects.end(); ++ keyValuePair){
        if (found) {
          out << ", ";
        }
        found = true;
        if (!percentEncodeStrings)
          out << '"' << Encodings::getStringWithEscapedNewLinesQuotesBackslashes(keyValuePair->first) << '"';
        else
          out << '"' << Encodings::getPercentEncodedStringEncodeDots(keyValuePair->first, false) << '"';
        out << ':';
        keyValuePair->second->IntoStream(out, percentEncodeStrings, indentation, useHTML);
      }
      out << newLine << '}';
      return out;
    case JSopenBrace:
      if (useHTML) {
        out << "<b>";
      }
      out << "{";
      if (useHTML) {
        out << "</b>";
      }
      return out;
    case JScloseBrace:
      if (useHTML)
        out << "<b>";
      out << "}";
      if (useHTML)
        out << "</b>";
      return out;
    case JSopenBracket:
      if (useHTML)
        out << "<b>";
      out << "[";
      if (useHTML)
        out << "</b>";
      return out;
    case JScloseBracket:
      if (useHTML)
        out << "<b>";
      out << "]";
      if (useHTML)
        out << "</b>";
      return out;
    case JScolon:
      if (useHTML)
        out << "<b>";
      out << ":";
      if (useHTML)
        out << "</b>";
      return out;
    case JScomma:
      if (useHTML)
        out << "<b>";
      out << ",";
      if (useHTML)
        out << "</b>";
      return out;
    case JSUndefined:
      if (useHTML)
        out << "<b>";
      out << "undefined";
      if (useHTML)
        out << "</b>";
      return out;
    case JSerror:
      if (useHTML)
        out << "<b>";
      out << "error";
      if (useHTML)
        out << "</b>";
      return out;
    default:
      break;
  }
  //supposed to be unreachable
  assert(false);
  return out;
}

void JSData::writefile(const char* filename) const
{ std::ofstream out;
  out.open(filename);
  this->IntoStream(out, false);
}

void JSData::reset(char inputType)
{ this->type = inputType;
  this->boolean = false;
  this->number = 0;
  this->string = "";
  this->list.clear();
  this->objects.clear();
}

std::string JSData::toString(bool percentEncodeKeysIncludingDots, bool useHTML) const
{ std::stringstream out;
  this->IntoStream(out, percentEncodeKeysIncludingDots, 2, useHTML);
  return out.str();
}

std::ostream& operator<<(std::ostream& out, const JSData& data)
{ return data.IntoStream(out, false);
}

