declare global {
    namespace NodeJS {
        interface ProcessEnv {
            KEY_ID: string;
            API_KEY: string
        }
    }
}

export {}