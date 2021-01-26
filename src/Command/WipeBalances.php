<?php

namespace App\Command;

use App\Repository\AdminsRepository;
use App\Repository\UsersRepository;
use App\Service\Letscover;
use App\Service\VKAPI;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Doctrine\ORM\EntityManagerInterface;

class WipeBalances extends Command
{
    // the name of the command (the part after "bin/console")
    protected static $defaultName = 'app:wipe-balances';

    private $em;

    private $usersRep;

    private $adminsRep;

    public function __construct(
        EntityManagerInterface $entityManager,
        UsersRepository $usersRep,
        AdminsRepository $adminsRep,
        ?string $name = null
    ) {
        parent::__construct($name);

        $this->em = $entityManager;
        $this->usersRep = $usersRep;
        $this->adminsRep = $adminsRep;
    }

    protected function configure(){}

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $letscoverUsers = Letscover::getActivity();

        if (count($letscoverUsers) === 0) throw new \Exception('Letscover users count = 0');

        foreach ($letscoverUsers as $user) {
            Letscover::subBalance($user->userId, $user->points);
        }

        $this->usersRep->calcTalents();
        $this->usersRep->wipeBalances();

        $admins = $this->adminsRep->findAll();

        foreach ($admins as $admin) {
            try {
                VKAPI::sendMsg($admin->getUserId(), '[Обнуление умникоинов завершено]');
            } catch (\Exception $e) {}
        }

        return Command::SUCCESS;
    }
}