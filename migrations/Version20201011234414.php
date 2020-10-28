<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20201011234414 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE top_users DROP PRIMARY KEY');
        $this->addSql('ALTER TABLE top_users ADD PRIMARY KEY (user_id)');
        $this->addSql('ALTER TABLE users ADD CONSTRAINT FK_1483A5E9A76ED395 FOREIGN KEY (user_id) REFERENCES top_users (user_id)');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE top_users DROP PRIMARY KEY');
        $this->addSql('ALTER TABLE top_users ADD PRIMARY KEY (rank)');
        $this->addSql('ALTER TABLE users DROP FOREIGN KEY FK_1483A5E9A76ED395');
    }
}
