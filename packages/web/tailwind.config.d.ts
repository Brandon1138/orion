declare const _default: {
    content: string[];
    darkMode: "media";
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: string;
                    50: string;
                    100: string;
                    200: string;
                    300: string;
                    400: string;
                    500: string;
                    600: string;
                    700: string;
                    800: string;
                    900: string;
                };
                bg: {
                    DEFAULT: string;
                    subtle: string;
                    elevated: string;
                    dark: string;
                };
                border: {
                    DEFAULT: string;
                    dark: string;
                };
            };
            boxShadow: {
                soft: string;
                floating: string;
            };
            borderRadius: {
                lg: string;
                xl: string;
            };
            spacing: {
                '4.5': string;
                '18': string;
                '22': string;
            };
            maxWidth: {
                ch: string;
            };
        };
    };
    plugins: (({ addUtilities }: any) => void)[];
};
export default _default;
