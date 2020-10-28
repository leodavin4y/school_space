<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ExceptionListener {

    public function onKernelException(ExceptionEvent $event)
    {
        // You get the exception object from the received event
        $exception = $event->getThrowable();
        $message = sprintf('Error: %s', $exception->getMessage());

        // Customize your response object to display the exception details
        $response = new JsonResponse();
        $response->setContent($message);

        // HttpExceptionInterface is a special type of exception that
        // holds status code and header details
        if ($exception instanceof HttpExceptionInterface) {
            $statusCode = $exception->getStatusCode();
            $response->setStatusCode($statusCode);
            $response->headers->replace($exception->getHeaders());
        } else {
            $statusCode = JsonResponse::HTTP_INTERNAL_SERVER_ERROR;
            $response->setStatusCode($statusCode);

            if ($_ENV['APP_ENV'] !== 'dev') {
                $message = 'Oops something went wrong ...';
            }
        }

        $data = [
            'status' => false,
            'code' => $statusCode,
            'message' => $message,
        ];

        if ($_ENV['APP_ENV'] === 'dev') $data['trace'] = $exception->getTraceAsString();

        $response->setData($data);

        // sends the modified response object to the event
        $event->setResponse($response);
    }
}