<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20201006180803 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        //$this->addSql('ALTER TABLE points DROP FOREIGN KEY FK_27BA8E29CB944F1A');
        $this->addSql('ALTER TABLE points ADD cancel_comment VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE points ADD CONSTRAINT FK_27BA8E29CB944F1A FOREIGN KEY (student_id) REFERENCES users (user_id)');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE points DROP FOREIGN KEY FK_27BA8E29CB944F1A');
        $this->addSql('ALTER TABLE points DROP cancel_comment');
        $this->addSql('ALTER TABLE points ADD CONSTRAINT FK_27BA8E29CB944F1A FOREIGN KEY (student_id) REFERENCES students (user_id)');
    }
}
