<?php

namespace App\Service;

use App\Kernel;

class CommandLock {

    private $file;

    public function __construct(Kernel $kernel)
    {
        $this->file = $kernel->getProjectDir() . '/src/Command/lock_file';
    }

    public function lock()
    {
        file_put_contents($this->file, '1');
    }

    public function isLocked()
    {
        return file_exists($this->file);
    }

    public function unlock()
    {
        return $this->isLocked() ? unlink($this->file) : true;
    }

}