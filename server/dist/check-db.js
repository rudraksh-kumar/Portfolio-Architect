import { prisma } from './utils/db.js';
async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- Users ---');
        console.log(users);
        const portfolios = await prisma.portfolio.findMany();
        console.log('--- Portfolios ---');
        console.log(portfolios.map(p => ({
            id: p.id,
            slug: p.slug,
            userId: p.userId,
            theme: p.theme,
            views: p.views,
            profileDataLength: p.profileData.length
        })));
        const logs = await prisma.chatLog.findMany();
        console.log('--- Chat Logs ---');
        console.log(logs);
    }
    catch (error) {
        console.error('Database query failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
