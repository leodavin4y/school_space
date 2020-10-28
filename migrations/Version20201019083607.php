<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20201019083607 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX code ON promo_codes');
        $this->addSql('ALTER TABLE promo_codes ADD product_id INT NOT NULL');
        $this->addSql('ALTER TABLE promo_codes ADD CONSTRAINT FK_C84FDDB4584665A FOREIGN KEY (product_id) REFERENCES products (id)');
        $this->addSql('CREATE INDEX IDX_C84FDDB4584665A ON promo_codes (product_id)');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE promo_codes DROP FOREIGN KEY FK_C84FDDB4584665A');
        $this->addSql('DROP INDEX IDX_C84FDDB4584665A ON promo_codes');
        $this->addSql('ALTER TABLE promo_codes DROP product_id');
        $this->addSql('CREATE UNIQUE INDEX code ON promo_codes (code)');
    }
}
