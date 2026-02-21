const { resolveDestinationSlug } = require('./backend/src/services/contextBuilder.cjs');
console.log('Result for Kochi:', resolveDestinationSlug('Kochi'));
console.log('Result for Alleppey:', resolveDestinationSlug('Alleppey'));
console.log('Result for Srinagar:', resolveDestinationSlug('Srinagar'));
