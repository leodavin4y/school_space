<?php

namespace App\Command;

use App\Repository\PointsRepository;
use App\Repository\UsersRepository;
use App\Service\Letscover;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Doctrine\ORM\EntityManagerInterface;

class ResetPoints extends Command
{
    // the name of the command (the part after "bin/console")
    protected static $defaultName = 'app:wipe-balances';

    private $em;

    private $usersRep;

    public function __construct(
        EntityManagerInterface $entityManager,
        UsersRepository $usersRep,
        ?string $name = null
    ) {
        parent::__construct($name);

        $this->em = $entityManager;
        $this->usersRep = $usersRep;
    }

    protected function configure(){}

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $letscoverUsers = Letscover::getActivity();

        if (count($letscoverUsers) === 0) throw new \Exception('Letscover users count = 0');

        foreach ($letscoverUsers as $user) {
            Letscover::subBalance($user->userId, $user->points);
        }

        $this->usersRep->wipeBalances();

        return Command::SUCCESS;
    }
}