# PostRoast

A modern web application to "roast" your X (Twitter) posts using AI to provide engagement, friendliness, and virality scores, along with suggestions 
for improvement. Built with Next.js and OpenAI.

![PostRoast Screenshot](public/screenshot.png)

## ✨ Features

- 🔍 AI-powered post analysis & roasting
- 📊 Detailed scoring for engagement, friendliness, and virality (platform-adaptable)
- 💡 Smart suggestions for better posts
- 🎉 Confetti celebration for good scores
- 🎨 Clean and modern UI with dark theme
- ⚡ Instant results with no sign-up required
- 🔒 Secure API key management (server-side environment variables + optional user API keys)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm (recommended) or npm
- OpenAI API key

### Environment Setup

1. Create a `.env.local` file in the root directory:
   ```bash
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. Get your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

3. Replace `your_openai_api_key_here` with your actual API key

**Important Security Note**: Never commit your `.env.local` file to version control. The `.gitignore` file is already configured to exclude environment files.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/audiencon/x-post-analyzer.git
   cd xposts
   # Or: git clone https://github.com/audiencon/postroast.git
   # cd postroast
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

5. The app will use your OpenAI API key from the environment variable for all AI operations. Users can also provide their own API key for unlimited usage, while the default key has a 10 requests/hour limit. All API keys are handled server-side only, ensuring maximum security.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **AI**: OpenAI API
- **State Management**: React Hooks
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## 📁 Project Structure

```
src/
├── actions/               # Server actions and API handlers
│   └── analyze.ts         # OpenAI API integration
├── app/                   # Next.js app directory
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── analyze/           # Analysis components
│   │   ├── analyze-form.tsx    # Main analysis form
│   │   ├── scores-card.tsx     # Score display component
│   │   ├── suggestions-grid.tsx # Suggestions display
│   │   ├── form-header.tsx     # Extracted header component
│   │   ├── input-section.tsx   # Extracted input component
│   │   ├── analysis-display.tsx # Extracted results display
│   │   ├── suggestions-section.tsx # Extracted suggestions area
│   │   ├── score-display.tsx  # Extracted score helper
│   │   ├── score-comparison.tsx # Extracted comparison helper
│   │   └── suggestions-grid.tsx # Suggestions display
│   ├── api-key-dialog/    # API key management
│   │   └── api-key-dialog.tsx  # API key input dialog
│   └── ui/                # Reusable UI components
│       ├── button.tsx     # Button component
│       ├── textarea.tsx   # Textarea component
│       └── progress.tsx   # Progress bar component
├── lib/                   # Utility functions and helpers
├── public/                # Static assets
│   └── screenshot.png     # Project screenshot
└── types/                 # TypeScript type definitions
    └── analyze.ts         # Analysis result types
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Keep the code clean and well-documented
- Test your changes before submitting
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [OpenAI](https://openai.com/) for the AI capabilities
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful components
- [Framer Motion](https://www.framer.com/motion/) for the smooth animations

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/audiencon/x-post-analyzer/issues) on GitHub.
# Or: [open an issue](https://github.com/audiencon/postroast/issues)

---

Made with ❤️ by [Audiencon](https://github.com/audiencon)
