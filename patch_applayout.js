import fs from 'fs';

let content = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');

const searchStr = `        {
          name: "WhatsApp/Meta",
          href: "/settings/whatsapp",
          icon: <Smartphone size={16} />,
          adminOnly: true,
        },
      ],
    },`;

const replaceStr = `        {
          name: "WhatsApp/Meta",
          href: "/settings/whatsapp",
          icon: <Smartphone size={16} />,
          adminOnly: true,
        },
        {
          name: "Inteligência Artificial",
          href: "/settings/ai",
          icon: <Settings size={16} />,
          adminOnly: true,
        },
      ],
    },`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/components/layout/AppLayout.tsx', content);
console.log("Patched AppLayout.tsx");
