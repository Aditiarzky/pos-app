import re  
  
with open('src/app/dashboard/products/_components/product-card.tsx', 'r', encoding='utf-8-sig') as f:  
    content = f.read()  
print('Read OK, length:', len(content))  
