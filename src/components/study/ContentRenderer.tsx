import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../constants/theme';
import { useThemeStore } from '../../stores/themeStore';

interface ContentRendererProps {
  content: string;
  fontSize: 'small' | 'medium' | 'large';
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, fontSize }) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const getFontSize = () => {
    switch (fontSize) {
      case 'small': return 14;
      case 'large': return 20;
      case 'medium':
      default:
        return 16;
    }
  };

  const getLineHeight = () => {
    switch (fontSize) {
      case 'small': return 20;
      case 'large': return 28;
      case 'medium':
      default:
        return 24;
    }
  };

  const renderBoldText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <Text key={i} style={[styles.bold, { color: colors.text }]}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Image
      if (line.match(/^!\[.*?\]\((.*?)\)/)) {
        const match = line.match(/^!\[.*?\]\((.*?)\)/);
        if (match && match[1]) {
          return (
            <Image 
              key={index}
              source={{ uri: match[1] }} 
              style={{ width: '100%', height: 200, borderRadius: 12, marginVertical: 16, backgroundColor: 'rgba(255,255,255,0.05)' }}
              resizeMode="contain"
            />
          );
        }
      }
      // Heading 3
      if (line.startsWith('### ')) {
        return (
          <Text
            key={index}
            style={[
              styles.h3,
              { color: colors.text, fontSize: getFontSize() + 4, lineHeight: getLineHeight() + 4 }
            ]}
          >
            {line.replace('### ', '')}
          </Text>
        );
      }
      // Heading 2
      if (line.startsWith('## ')) {
        return (
          <Text
            key={index}
            style={[
              styles.h2,
              { color: colors.text, fontSize: getFontSize() + 6, lineHeight: getLineHeight() + 6 }
            ]}
          >
            {line.replace('## ', '')}
          </Text>
        );
      }
      // Bullet list item
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const itemText = line.substring(2);
        return (
          <View key={index} style={styles.bulletRow}>
            <Text style={[styles.bulletDot, { color: colors.primary, fontSize: getFontSize() }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.textSecondary, fontSize: getFontSize(), lineHeight: getLineHeight() }]}>
              {renderBoldText(itemText)}
            </Text>
          </View>
        );
      }
      // Numbered list item
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+\.)\s(.*)/);
        if (match) {
          const num = match[1];
          const itemText = match[2];
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={[styles.bulletNum, { color: colors.primary, fontSize: getFontSize() }]}>{num}</Text>
              <Text style={[styles.bulletText, { color: colors.textSecondary, fontSize: getFontSize(), lineHeight: getLineHeight() }]}>
                {renderBoldText(itemText)}
              </Text>
            </View>
          );
        }
      }
      // Empty line
      if (line.trim() === '') {
        return <View key={index} style={styles.spacing} />;
      }
      // Paragraph
      return (
        <Text
          key={index}
          style={[
            styles.p,
            { color: colors.textSecondary, fontSize: getFontSize(), lineHeight: getLineHeight() }
          ]}
        >
          {renderBoldText(line)}
        </Text>
      );
    });
  };

  return <View style={styles.container}>{parseMarkdown(content)}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  h2: {
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
  },
  h3: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  p: {
    marginBottom: 10,
  },
  bold: {
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 8,
  },
  bulletDot: {
    marginRight: 8,
    fontWeight: '900',
  },
  bulletNum: {
    marginRight: 8,
    fontWeight: '700',
    minWidth: 16,
  },
  bulletText: {
    flex: 1,
  },
  spacing: {
    height: 12,
  },
});
