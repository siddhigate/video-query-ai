import React from 'react';

// Accept all standard img props
const Logo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => {
  return (<>{/* <a href="https://www.flaticon.com/free-icons/letter-v" title="letter v icons">Letter v icons created by yukyik - Flaticon</a> */}<img src="/logo.png" alt="Logo" {...props} /></>);
};

export default Logo;
