import React from 'react';

interface ImgProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * メール用画像コンポーネント
 *
 * 開発時: `/MAIL-ASSETS/{filename}` で表示
 * ビルド時（CI）: S3 URL `https://{S3_BUCKET_URL}/archives/{YYYY}/{MM}/{DD-MSG}/assets/{filename}` に自動置換される
 */
export function Img({ src, alt, width, height, style, className }: ImgProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={style}
      className={className}
    />
  );
}
