/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4169E1',
          hover: '#3154C4',
          light: '#6588F2',
          subtle: '#EFF6FF',
        },
        navy: {
          DEFAULT: '#172554',
          dark: '#0F172A',
          card: '#1E293B',
        },
        lavender: {
          DEFAULT: '#F3F0FF',
          border: '#E9D5FF',
          dark: '#7C3AED',
        },
        bg: {
          main: '#F8FAFC',
          card: '#FFFFFF',
          subtle: '#F1F5F9',
        },
        text: {
          primary: '#1E293B',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
          focus: '#4169E1',
        },
        status: {
          waiting: '#F59E0B',
          waitingBg: '#FEF3C7',
          called: '#3B82F6',
          calledBg: '#DBEAFE',
          inConsultation: '#8B5CF6',
          inConsultationBg: '#EDE9FE',
          completed: '#16A34A',
          completedBg: '#DCFCE7',
          noShow: '#6B7280',
          noShowBg: '#F3F4F6',
          cancelled: '#DC2626',
          cancelledBg: '#FEE2E2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
