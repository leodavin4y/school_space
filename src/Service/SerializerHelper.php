<?php

namespace App\Service;

use Doctrine\Common\Annotations\AnnotationReader;
use Symfony\Component\Serializer\Mapping\Factory\ClassMetadataFactory;
use Symfony\Component\Serializer\Mapping\Loader\AnnotationLoader;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;

/**
 * Class SerializerHelper
 * @package App\Service
 */
class SerializerHelper {

    private $factory;

    private $serializer;

    private $encoders;

    private $callbacks = [];

    /**
     * @param string $fieldName
     * @param callable $callback
     * @return $this
     */
    public function convertField(string $fieldName, callable $callback)
    {
        $this->callbacks[$fieldName] = $callback;

        return $this;
    }

    /**
     * @return Serializer
     * @throws \Doctrine\Common\Annotations\AnnotationException
     */
    public function getSerializer(): Serializer
    {
        if (is_null($this->factory)) {
            $this->factory = new ClassMetadataFactory(new AnnotationLoader(new AnnotationReader()));
        }

        if (is_null($this->encoders)) {
            $this->encoders = [new JsonEncoder()];
        }

        $normalizer = new ObjectNormalizer(
            $this->factory,
            null,
            null,
            null,
            null,
            null,
            $this->createContext()
        );
        $this->serializer = new Serializer([$normalizer], $this->encoders);

        return $this->serializer;
    }

    /**
     * @return array
     */
    private function createContext(): array
    {
        return [
            AbstractNormalizer::CIRCULAR_REFERENCE_HANDLER => function ($object, $format, $context) {
                return $object->getId();
            },
            AbstractNormalizer::CALLBACKS => $this->callbacks
        ];
    }
}