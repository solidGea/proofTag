-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barcode` VARCHAR(255) NOT NULL,
    `productName` VARCHAR(500) NOT NULL,
    `measure` VARCHAR(100) NULL,
    `rating` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_barcode_key`(`barcode`),
    INDEX `Product_barcode_idx`(`barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScanHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barcode` VARCHAR(255) NOT NULL,
    `found` BOOLEAN NOT NULL DEFAULT false,
    `productId` INTEGER NULL,
    `scannedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ScanHistory_barcode_idx`(`barcode`),
    INDEX `ScanHistory_scannedAt_idx`(`scannedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ScanHistory` ADD CONSTRAINT `ScanHistory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
