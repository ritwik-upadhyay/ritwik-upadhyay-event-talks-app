import os
import time
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify, request
from bs4 import BeautifulSoup
from datetime import datetime

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_DURATION = 600  # 10 minutes (600 seconds)

# Store cache in-memory
cache_data = None
cache_time = 0

def fetch_and_parse_feed(bypass_cache=False):
    global cache_data, cache_time
    now = time.time()
    
    if not bypass_cache and cache_data and (now - cache_time < CACHE_DURATION):
        return cache_data
        
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = root.findall('atom:entry', ns)
        parsed_updates = []
        
        for entry in entries:
            date_str = entry.find('atom:title', ns)
            date_str = date_str.text.strip() if date_str is not None else "Unknown Date"
            
            entry_id = entry.find('atom:id', ns)
            entry_id = entry_id.text.strip() if entry_id is not None else f"id-{time.time()}"
            
            link_el = entry.find('atom:link', ns)
            link_href = link_el.attrib.get('href', '') if link_el is not None else "https://cloud.google.com/bigquery/docs/release-notes"
            
            content_el = entry.find('atom:content', ns)
            if content_el is None or not content_el.text:
                continue
                
            content_html = content_el.text
            soup = BeautifulSoup(content_html, 'html.parser')
            
            current_type = None
            current_elements = []
            
            def add_update(utype, elements):
                item_html = "".join(str(el) for el in elements).strip()
                item_text = "".join(el.get_text() if hasattr(el, 'get_text') else str(el) for el in elements).strip()
                if item_html:
                    # Clean double whitespaces and linebreaks for tweets
                    clean_text = " ".join(item_text.split())
                    parsed_updates.append({
                        'date': date_str,
                        'id': f"{entry_id}#{len(parsed_updates)}",
                        'type': utype,
                        'html': item_html,
                        'text': clean_text,
                        'link': link_href
                    })

            for child in soup.children:
                if child.name == 'h3':
                    if current_elements:
                        add_update(current_type or 'General', current_elements)
                    current_type = child.get_text().strip()
                    current_elements = []
                else:
                    # Skip empty string nodes to clean up output
                    if child.name is not None or (isinstance(child, str) and child.strip()):
                        current_elements.append(child)
                        
            if current_elements:
                add_update(current_type or 'General', current_elements)
                
        cache_data = parsed_updates
        cache_time = now
        return cache_data
    except Exception as e:
        print("Error fetching/parsing feed:", e)
        # If fetch fails but we have cached data (even if expired), return it
        if cache_data:
            return cache_data
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/updates')
def get_updates():
    try:
        bypass_cache = request.args.get('refresh', 'false').lower() == 'true'
        updates = fetch_and_parse_feed(bypass_cache=bypass_cache)
        return jsonify({
            'success': True,
            'updates': updates,
            'last_updated': datetime.fromtimestamp(cache_time).strftime('%Y-%m-%d %H:%M:%S')
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Running on port 5001 to avoid default mac OS airplay port conflict on 5000
    app.run(debug=True, host='127.0.0.1', port=5001)
