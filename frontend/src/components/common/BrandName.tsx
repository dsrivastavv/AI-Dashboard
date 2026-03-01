import { PRODUCT_NAME } from '../../config/branding';

export default function BrandName() {
  const [lead, ...tail] = PRODUCT_NAME.split(' ');
  const remainder = tail.join(' ');

  return (
    <span className="aid-wordmark">
      <span className="aid-wordmark__ai">{lead || PRODUCT_NAME}</span>
      {remainder ? ` ${remainder}` : null}
    </span>
  );
}
