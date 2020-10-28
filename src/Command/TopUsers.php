<?php

namespace App\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Doctrine\ORM\EntityManagerInterface;

class TopUsers extends Command
{
    // the name of the command (the part after "bin/console")
    protected static $defaultName = 'app:top-users';

    private $em;

    public function __construct(EntityManagerInterface $entityManager, ?string $name = null)
    {
        parent::__construct($name);

        $this->em = $entityManager;
    }

    protected function configure()
    {
        // the short description shown while running "php bin/console list"
        $this->setDescription('Command for re-creating `top_users` table (prev table will be trunc)')
            // the full command description shown when running the command with
            // the "--help" option
            ->setHelp('This command re-build list with most active users by current month');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $conn = $this->em->getConnection();

        $conn->exec("
            TRUNCATE top_users;

            SET @row_number := 0;
            
            INSERT INTO top_users (rank, user_id, points) SELECT * FROM (
                SELECT (@row_number := @row_number + 1) AS `rank`, t.user_id, t.points FROM (
                    SELECT p.student_id as user_id, SUM(p.amount) as points, MIN(p.created_at) as created_at
                      FROM points as p
                        WHERE MONTH(p.created_at) = MONTH(CURRENT_DATE()) AND verify = 1
                      GROUP BY p.student_id
                ) as t ORDER BY t.points DESC, t.created_at ASC
            ) as tt;
        ");

        return Command::SUCCESS;
    }
}