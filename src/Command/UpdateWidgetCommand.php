<?php

namespace App\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use App\Service\Widget;

class UpdateWidgetCommand extends Command
{
    protected static $defaultName = 'app:update-widget';

    protected $widget;

    public function __construct(Widget $widget, ?string $name = null)
    {
        parent::__construct($name);

        $this->widget = $widget;
    }

    protected function configure()
    {
        $this->setDescription('Обновляет виджет для группы ВК. Запускать раз в минуту.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        return $this->widget->update() ? Command::SUCCESS : Command::FAILURE;
    }
}
