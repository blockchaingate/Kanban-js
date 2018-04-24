#ifndef LOGGING_H_header
#define LOGGING_H_header

class Logger
{
public:
  std::fstream theFile;
  enum logModifiers{ endL};
  friend Logger& operator << (Logger& inputLogger, logModifiers other)
  { if (other == Logger::endL)
      std::cout << std::endl;
    return inputLogger;
  }
  template<typename any>
  friend Logger& operator << (Logger& inputLogger, const any& other)
  { inputLogger.theFile << other;
    inputLogger.theFile.flush();
    std::cout << other;
    return inputLogger;
  }
  Logger(const std::string& pathname = "../logfiles/logfile.txt")
  { this->theFile.open(pathname, std::fstream::out | std::fstream::trunc);
  }
  ~Logger()
  { this->theFile.close();
  }

};

#endif // LOGGING_H

