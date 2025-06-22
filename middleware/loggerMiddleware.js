const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/request_response.log');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  const chunks = [];
  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk) {
    chunks.push(Buffer.from(chunk));
    originalWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString('utf8');

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      requestHeaders: req.headers,
      requestBody: req.body,
      responseStatus: res.statusCode,
      responseTime: `${Date.now() - start}ms`,
      responseBody: body
    };
    console.log(logEntry);
    
    fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', err => {
      if (err) console.error('Error writing log:', err);
    });

    originalEnd.apply(res, arguments);
  };

  next();
};

module.exports = loggerMiddleware;
