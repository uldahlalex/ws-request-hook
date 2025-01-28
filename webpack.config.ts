import type { Configuration } from 'webpack';

const config: Configuration = {
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react', '@babel/preset-typescript']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    }
};

export default config;