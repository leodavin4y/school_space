<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20201017075628 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        //$this->addSql('ALTER TABLE orders DROP INDEX FK_E52FFDEE4584665A, ADD UNIQUE INDEX UNIQ_E52FFDEE4584665A (product_id)');
        $this->addSql('ALTER TABLE products ADD enabled TINYINT(1) NOT NULL');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        //$this->addSql('ALTER TABLE orders DROP INDEX UNIQ_E52FFDEE4584665A, ADD INDEX FK_E52FFDEE4584665A (product_id)');
        $this->addSql('ALTER TABLE products DROP enabled');
    }
}
