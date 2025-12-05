from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Updater, CommandHandler, CallbackContext
import random

BOT_TOKEN = "8559558024:AAHFPOz7-tSSD5Ut69ufCfyZDJXsktnBpkI"

def start(update: Update, context: CallbackContext):
    room_id = f"ROOM{random.randint(1000,9999)}"
    link = f"https://yourgame.onrender.com/?room={room_id}"
    keyboard = [[InlineKeyboardButton("🎮 Play with Friend", url=link)]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    update.message.reply_text("مرحباً! العب الآن مع صديقك:", reply_markup=reply_markup)

updater = Updater(BOT_TOKEN)
updater.dispatcher.add_handler(CommandHandler('start', start))
updater.start_polling()
updater.idle()
