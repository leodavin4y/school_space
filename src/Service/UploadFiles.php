<?php

namespace App\Service;

use App\Kernel;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\File\File;
use Intervention\Image\ImageManagerStatic as Image;

class UploadFiles {

    /**
     * @var string
     */
    private $uploadDir = '/var/upload';

    /**
     * @var string|null
     */
    private $projectDir;

    /**
     * @var string
     */
    private $tempDir;

    /**
     * @var string|null
     */
    private $namePrefix;

    /**
     * @var UploadedFile[]
     */
    private $files = [];

    /**
     * Upload constructor.
     * @param Kernel $kernel
     */
    public function __construct(Kernel $kernel)
    {
        $this->projectDir = $kernel->getProjectDir();
        $this->uploadDir = $this->projectDir . $this->uploadDir;
        $this->tempDir = sys_get_temp_dir();
    }

    /**
     * @param string $prefix
     * @return $this
     */
    public function setNamePrefix(string $prefix)
    {
        $this->namePrefix = $prefix;

        return $this;
    }

    /**
     * @param UploadedFile[] $files
     * @return $this
     */
    public function setFiles(array $files)
    {
        $this->files = $files;

        return $this;
    }

    /**
     * @param string $uploadDir - with first slash (/var/upload)
     * @return $this
     */
    public function setUploadDir(string $uploadDir)
    {
        $this->uploadDir = $this->projectDir . $uploadDir;

        return $this;
    }

    /**
     * @param UploadedFile $file
     * @return string
     */
    protected function createUniqName(UploadedFile $file)
    {
        $hash = uniqid();
        $prefix = $this->namePrefix ?? '';

        return "{$prefix}{$hash}.{$file->guessExtension()}";
    }

    /**
     * @return File[] $files;
     * @throws \Exception
     */
    public function processFiles(): array
    {
        $mimeWhiteList = ['image/jpeg', 'image/png'];

        foreach ($this->files as $file) {
            if (!$file->isValid()) throw new \Exception('One or more files are damaged during upload');
            if (!in_array($file->getMimeType(), $mimeWhiteList)) throw new \Exception('One or more files are of an unsupported type');
        }

        $files = [];

        Image::configure(['driver' => 'gd']);

        foreach ($this->files as $file) {
            $tmpPath = $file->getPathname();
            $format = $file->getMimeType() === 'image/jpeg' ? 'jpg' : 'png';
            $im = Image::make($file);

            $im->resize($im->getWidth() - 1, $im->getHeight() - 1)
                ->save($tmpPath, 70, $format);
        }

        foreach ($this->files as $file) {
            $files[] = $file->move($this->uploadDir, $this->createUniqName($file));
        }

        return $files;
    }

}