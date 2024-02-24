import requests
import tkinter as tk
import time
import threading

# Color Palette
m1c = '#00ffff'
bgc = '#222222'
dbg = '#000000'
fgc = '#FCFCFC'
custom_color = '#00f000'

root = tk.Tk()
root.title("Social Scout v2.0")
root.geometry("620x620")  # Set window size and position
root.tk_setPalette(background=bgc, foreground=m1c, activeBackground=fgc, activeForeground=bgc, highlightColor=m1c, highlightBackground=m1c)


def running_threads():
    def search_username(username):
        result_listbox.delete(0, tk.END)

        # List of websites
        websites = [
            f'https://www.instagram.com/{username}',
            f'https://www.facebook.com/{username}',
            f'https://www.twitter.com//{username}',
            f'https://www.linkedin.com/in/{username}',
            f'https://www.snapchat.com/{username}',
            f'https://www.tiktok.com/{username}',
            f'https://www.flickr.com/{username}',
            f'https://www.meetup.com/{username}',
            f'https://nextdoor.com/{username}',
            f'https://www.youtube.com/{username}',
            f'https://plus.google.com/s/{{username}}/top',
            f'https://www.reddit.com/user/{{username}}',
            f'https://www.pinterest.com/{{username}}',
            f'https://www.github.com/{{username}}',
            f'https://www.flickr.com/people/{{username}}',
            f'https://steamcommunity.com/id/{{username}}',
            f'https://vimeo.com/{{username}}',
            f'https://soundcloud.com/{{username}}',
            f'https://medium.com/@{{username}}',
            f'https://about.me/{{username}}',
            f'https://imgur.com/user/{{username}}',
            f'https://flipboard.com/@{{username}}',
            f'https://open.spotify.com/user/{{username}}',
            f'https://www.dailymotion.com/{{username}}',
            f'https://www.etsy.com/shop/{{username}}',
            f'https://dribbble.com/{{username}}',
            f'https://www.codecademy.com/{{username}}',
            f'https://pastebin.com/u/{{username}}',
            f'https://www.roblox.com/user.aspx?username={{username}}',
            f'https://www.canva.com/{{username}}',
            f'https://buzzfeed.com/{{username}}',
            f'https://tripadvisor.com/members/{{username}}',
            f'https://www.wikipedia.org/wiki/User:{{username}}',        
            f'https://www.okcupid.com/profile/{{username}}',
            # ... Add more website URLs
        ]
        
        def print_in_color(color, msg):
            result_listbox.insert(tk.END, msg)
            result_listbox.itemconfig(tk.END, {'fg': color})

        print_in_color(m1c, f'[+] Searching for username: {username}')
        time.sleep(0.5)
        print_in_color(fgc, '.......\n')

        count = 0
        match = True

        for url in websites:
            r = requests.get(url)

            if r.status_code == 200:
                if match:
                    print_in_color(m1c, '[+] FOUND MATCHES')
                    match = False
                print_in_color(fgc, f'\n{url} - {r.status_code} - OK')
                if username in r.text:
                    print_in_color('#7FFF00', f'POSITIVE MATCH: Username: {username} - text has been detected in url.')
                else:
                    print_in_color(m1c, f'POSSIBLE MATCH: Username: {username} - text NOT detected in url, could be a FALSE POSITIVE.')
            count += 1

        total = len(websites)
        print_in_color('#7FFF00', f'\nFINISHED: A total of {count} MATCHES found out of {total} websites.')

    username = username_entry.get()  # Extract username from the entry field
    thread = threading.Thread(target=lambda: search_username(username))
    thread.start()

def clear_entry():
    username_entry.delete(0, tk.END)
    result_listbox.delete(0, tk.END)
   

# GUI Creation
frame = tk.Frame(root, bg=bgc)
frame.pack(padx=20, pady=20)

username_label = tk.Label(frame, text="Enter username to search:", font='sans 10 bold', fg=m1c, bg=bgc)
username_label.pack()

username_entry = tk.Entry(frame, bg='#484848', width=26, fg=custom_color, insertbackground=custom_color)  # Custom color for entry text
username_entry.pack()

# Buttons Frame
button_frame = tk.Frame(frame)
button_frame.pack(pady=5)

# Search Button
search_button1 = tk.Button(button_frame, text="Search", font='sans 10 bold', command=running_threads, bg='#838B8B', fg=custom_color)
search_button1.pack(side=tk.LEFT, padx=5)

# Refresh Button
refresh_button2 = tk.Button(button_frame, text="Refresh", font='sans 10 bold', command=clear_entry, bg='#838B8B', fg=custom_color)
refresh_button2.pack(side=tk.LEFT, padx=5)

result_listbox = tk.Listbox(frame, bg='#484848', width=100, height=26, fg=custom_color)  # Custom color for listbox text
result_listbox.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)  # Fill and expand the listbox

# Adding status bar at the bottom
root.status_bar = tk.Label(root, text="############################################", fg='#A9A9A9', bd=2)
root.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
root.status_message = tk.Label(root, text='Social Scout', font='sans 10 bold', fg='#A9A9A9', bd=2)
root.status_message.pack(side=tk.BOTTOM, fill=tk.X)
root.status_desc = tk.Label(root, text="Social Network Username Search & Discovery", font='sans 10 bold', fg='#A9A9A9', bd=2)
root.status_desc.pack(side=tk.BOTTOM, fill=tk.X)
root.status_separator = tk.Label(root, text="############################################", fg='#A9A9A9', bd=2)
root.status_separator.pack(side=tk.BOTTOM, fill=tk.X)

root.mainloop()
