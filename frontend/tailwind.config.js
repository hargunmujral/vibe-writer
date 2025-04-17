/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark:    '#2563eb',
          light:   '#60a5fa',
        },
        editor: {
          bg:   '#1e1e1e',
          text: '#d4d4d4',
          line: '#2a2a2a',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color:      '#d4d4d4',
            maxWidth:   '65ch',
            fontSize:   '1.125rem',
            lineHeight: '1.8',
            p: {
              marginTop:    '1.25em',
              marginBottom: '1.25em',
            },
            a: {
              color:       '#60a5fa',
              '&:hover': { color: '#93c5fd' },
            },
            h1: {
              color:        '#f8fafc',
              fontWeight:   '800',
              fontSize:     '2.25em',
              marginTop:    '1em',
              marginBottom: '0.5em',
              lineHeight:   '1.3',
            },
            h2: {
              color:        '#f8fafc',
              fontWeight:   '700',
              fontSize:     '1.8em',
              marginTop:    '1.5em',
              marginBottom: '0.5em',
              lineHeight:   '1.35',
            },
            h3: {
              color:        '#f8fafc',
              fontWeight:   '600',
              fontSize:     '1.5em',
              marginTop:    '1.5em',
              marginBottom: '0.5em',
            },
            h4: {
              color:        '#f8fafc',
              fontWeight:   '600',
              marginTop:    '1.5em',
              marginBottom: '0.5em',
            },
            strong: { color: '#f8fafc' },
            code:   { color: '#f8fafc' },
            blockquote: {
              color:             '#94a3b8',
              borderLeftWidth:   '0.25em',
              borderLeftColor:   '#475569',
              fontStyle:         'italic',
              marginLeft:        '0',
              paddingLeft:       '1.25em',
            },
            ul: { listStyleType: 'disc', paddingLeft: '1.625em' },
            ol: { paddingLeft: '1.625em' },
            li: { marginTop: '0.5em', marginBottom: '0.5em' },
            hr: {
              marginTop:    '2em',
              marginBottom: '2em',
              borderColor:  '#475569',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
