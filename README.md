Deployed on this Server https://hackathon-1-hml5.onrender.com

API: Add Product to Collection
url/add-to-collection
params => { user_email, collection_name, sku }


API: Get Collection List
url/collections/:user_email
params => user_email

API: Get Collection details
url/collection-details/:user_email'
params => user_email


API: Update Collection Details (Increment Like/Dislike)
url/update-collection-details
params => { collection_id, sku, action, user_email, submitter }
