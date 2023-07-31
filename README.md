
# HTTP Request Scheduler

This API is based on a class allowing to execute several HTTP(S) requests in a certain order, according to a priority associated with each. The requests are executed asynchronously, and the execution of a request can be canceled at any time. The API is built with Node.js.

## Author

[@aimenftaiti](https://www.github.com/aimenftaiti)

## Installation

Install the project with npm

```bash
  git clone https://www.github.com/aimenftaiti/http-request-scheduler
  cd http-request-scheduler
  npm install 
```

## API Reference

#### Add requests

```http
  POST /add_requests
```

#### Get request status

```http
  GET /request_status/${id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Id of request to fetch |

#### Cancel request

```http
  DELETE /cancel_request/${id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Id of request to cancel |

## Usage/Examples

You can leverage this API with services like Postman to send requests, or any tools/language that can send HTTP requests.
