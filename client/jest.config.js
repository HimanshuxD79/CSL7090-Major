export default {
    transform: {
        '^.+\\.[t|j]sx?$': 'babel-jest',
    },
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        customExportConditions: [''],
    },
};
