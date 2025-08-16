export default {
    content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
    darkMode: 'media',
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#6366F1',
                    50: '#EEF2FF',
                    100: '#E0E7FF',
                    200: '#C7D2FE',
                    300: '#A5B4FC',
                    400: '#818CF8',
                    500: '#6366F1',
                    600: '#4F46E5',
                    700: '#4338CA',
                    800: '#3730A3',
                    900: '#312E81',
                },
                bg: {
                    DEFAULT: 'rgb(250 250 250)',
                    subtle: 'rgb(245 245 245)',
                    elevated: 'rgb(255 255 255)',
                    dark: 'rgb(23 23 23)',
                },
                border: {
                    DEFAULT: 'rgb(228 228 231)',
                    dark: 'rgb(38 38 38)',
                },
            },
            boxShadow: {
                soft: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
                floating: '0 8px 24px rgb(0 0 0 / 0.12)',
            },
            borderRadius: {
                lg: '12px',
                xl: '16px',
            },
            spacing: {
                '4.5': '1.125rem',
                '18': '4.5rem',
                '22': '5.5rem',
            },
            maxWidth: {
                ch: '65ch',
            },
        },
    },
    plugins: [
        function ({ addUtilities }) {
            addUtilities({
                '.scrollbar-thin': {
                    scrollbarWidth: 'thin',
                },
                '.scrollbar-thumb-rounded': {
                    '&::-webkit-scrollbar-thumb': { borderRadius: '9999px' },
                },
            });
        },
    ],
};
