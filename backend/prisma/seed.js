const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Seed products
  const products = [
    {
      barcode: '6281006703841',
      productName: 'LIPTON GREEN TEA 1X150G 100S CLASSIC GREEN TEA',
      measure: 'ITEM',
      rating: 1,
    },
    // Add more sample products for testing
    {
      barcode: '1234567890123',
      productName: 'Sample Product 1',
      measure: 'ITEM',
      rating: 5,
    },
    {
      barcode: '9876543210987',
      productName: 'Sample Product 2',
      measure: 'PACK',
      rating: 4,
    },
  ];

  for (const product of products) {
    const result = await prisma.product.upsert({
      where: { barcode: product.barcode },
      update: {},
      create: product,
    });
    console.log(`Created/Updated product: ${result.productName}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
